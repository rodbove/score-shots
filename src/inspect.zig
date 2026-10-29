const std = @import("std");

const max_input = 5 * 1024 * 1024;

var buffer: [max_input]u8 = undefined;
var width: u32 = 0;
var height: u32 = 0;

pub const Format = enum(u32) { unknown = 0, png = 1, jpeg = 2, gif = 3, webp = 4 };

const Info = struct { format: Format, width: u32, height: u32 };

export fn inputPtr() [*]u8 {
    return &buffer;
}

export fn inputCap() u32 {
    return max_input;
}

export fn imageWidth() u32 {
    return width;
}

export fn imageHeight() u32 {
    return height;
}

export fn inspect(len: u32) u32 {
    width = 0;
    height = 0;
    if (len > max_input) return 0;
    const info = analyze(buffer[0..len]) orelse return 0;
    width = info.width;
    height = info.height;
    return @intFromEnum(info.format);
}

pub fn analyze(data: []const u8) ?Info {
    const info = png(data) orelse gif(data) orelse webp(data) orelse jpeg(data) orelse return null;
    if (info.width == 0 or info.height == 0) return null;
    return info;
}

fn png(data: []const u8) ?Info {
    if (data.len < 24) return null;
    if (!std.mem.eql(u8, data[0..8], "\x89PNG\r\n\x1a\n")) return null;
    if (!std.mem.eql(u8, data[12..16], "IHDR")) return null;
    return .{
        .format = .png,
        .width = std.mem.readInt(u32, data[16..20], .big),
        .height = std.mem.readInt(u32, data[20..24], .big),
    };
}

fn gif(data: []const u8) ?Info {
    if (data.len < 10) return null;
    if (!std.mem.eql(u8, data[0..6], "GIF87a") and !std.mem.eql(u8, data[0..6], "GIF89a")) return null;
    return .{
        .format = .gif,
        .width = std.mem.readInt(u16, data[6..8], .little),
        .height = std.mem.readInt(u16, data[8..10], .little),
    };
}

fn webp(data: []const u8) ?Info {
    if (data.len < 30) return null;
    if (!std.mem.eql(u8, data[0..4], "RIFF") or !std.mem.eql(u8, data[8..12], "WEBP")) return null;
    const chunk = data[12..16];
    if (std.mem.eql(u8, chunk, "VP8 ")) {
        return .{
            .format = .webp,
            .width = std.mem.readInt(u16, data[26..28], .little) & 0x3fff,
            .height = std.mem.readInt(u16, data[28..30], .little) & 0x3fff,
        };
    }
    if (std.mem.eql(u8, chunk, "VP8L")) {
        const bits = std.mem.readInt(u32, data[21..25], .little);
        return .{
            .format = .webp,
            .width = (bits & 0x3fff) + 1,
            .height = ((bits >> 14) & 0x3fff) + 1,
        };
    }
    if (std.mem.eql(u8, chunk, "VP8X")) {
        return .{
            .format = .webp,
            .width = @as(u32, std.mem.readInt(u24, data[24..27], .little)) + 1,
            .height = @as(u32, std.mem.readInt(u24, data[27..30], .little)) + 1,
        };
    }
    return null;
}

fn jpeg(data: []const u8) ?Info {
    if (data.len < 4 or data[0] != 0xff or data[1] != 0xd8) return null;
    var i: usize = 2;
    while (i + 3 < data.len) {
        if (data[i] != 0xff) return null;
        var marker = data[i + 1];
        while (marker == 0xff and i + 2 < data.len) {
            i += 1;
            marker = data[i + 1];
        }
        switch (marker) {
            0xd8, 0x01, 0xd0...0xd7 => {
                i += 2;
                continue;
            },
            0xd9, 0xda => return null,
            else => {},
        }
        if (i + 4 > data.len) return null;
        const seg_len = std.mem.readInt(u16, data[i + 2 ..][0..2], .big);
        const is_sof = marker >= 0xc0 and marker <= 0xcf and marker != 0xc4 and marker != 0xc8 and marker != 0xcc;
        if (is_sof) {
            if (i + 9 > data.len) return null;
            return .{
                .format = .jpeg,
                .height = std.mem.readInt(u16, data[i + 5 ..][0..2], .big),
                .width = std.mem.readInt(u16, data[i + 7 ..][0..2], .big),
            };
        }
        i += 2 + seg_len;
    }
    return null;
}

test "png" {
    const bytes = "\x89PNG\r\n\x1a\n\x00\x00\x00\x0dIHDR\x00\x00\x07\x80\x00\x00\x04\x38";
    const info = analyze(bytes).?;
    try std.testing.expectEqual(Format.png, info.format);
    try std.testing.expectEqual(@as(u32, 1920), info.width);
    try std.testing.expectEqual(@as(u32, 1080), info.height);
}

test "gif" {
    const info = analyze("GIF89a\x40\x01\xf0\x00").?;
    try std.testing.expectEqual(Format.gif, info.format);
    try std.testing.expectEqual(@as(u32, 320), info.width);
    try std.testing.expectEqual(@as(u32, 240), info.height);
}

test "jpeg" {
    const bytes = "\xff\xd8\xff\xe0\x00\x04ab\xff\xc0\x00\x11\x08\x02\xd0\x05\x00\x03";
    const info = analyze(bytes).?;
    try std.testing.expectEqual(Format.jpeg, info.format);
    try std.testing.expectEqual(@as(u32, 1280), info.width);
    try std.testing.expectEqual(@as(u32, 720), info.height);
}

test "rejects text" {
    try std.testing.expect(analyze("hello world, not an image at all") == null);
}
