using System.Text.Json;
using Clockwork.Umbraco.ImageFrame.Imaging;
using Clockwork.Umbraco.ImageFrame.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace Clockwork.Umbraco.ImageFrame.Tests;

public class StoredValueTests
{
    private const string Key = "9b0f3c2e-7a41-4f8e-9d55-2c1a6b7e8f90";

    [Fact]
    public void Parses_own_format()
    {
        var json = $$"""{"mediaKey":"{{Key}}","imageWidth":800,"imageHeight":200,"zoom":0.75,"x":0.4,"y":0.6,"rotation":-12.5,"flipX":true,"flipY":false}""";
        var value = ImageFrameStoredValue.Parse(json)!;

        Assert.Equal(Guid.Parse(Key), value.MediaKey);
        Assert.Equal(800, value.ImageWidth);
        Assert.False(value.IsLegacy);
        var t = value.ToTransform();
        Assert.Equal(0.75, t.Zoom);
        Assert.Equal(0.4, t.X);
        Assert.Equal(-12.5, t.Rotation);
        Assert.True(t.FlipX);
        Assert.False(t.FlipY);
    }

    [Fact]
    public void Parses_media_picker_v3_value()
    {
        var json = $$"""[{"key":"0d7c4a39-0000-4000-8000-000000000001","mediaKey":"{{Key}}","crops":[],"focalPoint":null}]""";
        var value = ImageFrameStoredValue.Parse(json)!;

        Assert.Equal(Guid.Parse(Key), value.MediaKey);
        Assert.True(value.IsLegacy);
        Assert.Equal(ImageFrameTransform.Default, value.ToTransform());
    }

    [Theory]
    [InlineData("umb://media/9b0f3c2e7a414f8e9d552c1a6b7e8f90")]
    [InlineData("umb://media/9b0f3c2e7a414f8e9d552c1a6b7e8f90,umb://media/11111111111141118111111111111111")]
    [InlineData("9b0f3c2e-7a41-4f8e-9d55-2c1a6b7e8f90")]
    public void Parses_legacy_udi_values(string input)
    {
        var value = ImageFrameStoredValue.Parse(input)!;
        Assert.Equal(Guid.Parse(Key), value.MediaKey);
        Assert.True(value.IsLegacy);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("[]")]
    [InlineData("{}")]
    [InlineData("{not json")]
    [InlineData("hello")]
    public void Returns_null_for_empty_or_invalid(string? input) => Assert.Null(ImageFrameStoredValue.Parse(input));

    [Fact]
    public void Parses_json_element_source()
    {
        using var doc = JsonDocument.Parse($$"""{"mediaKey":"{{Key}}","zoom":2}""");
        Assert.Equal(2, ImageFrameStoredValue.Parse(doc.RootElement)!.Zoom);
    }

    [Fact]
    public void Sanitizes_extreme_values()
    {
        var t = new ImageFrameTransform { Zoom = 1e9, X = double.NaN, Rotation = 725 }.Sanitize();
        Assert.Equal(50, t.Zoom);
        Assert.Equal(0.5, t.X);
        Assert.Equal(5, t.Rotation);
    }

    [Fact]
    public void Command_value_round_trips()
    {
        var t = new ImageFrameTransform { Zoom = 0.6667, X = 0.25, Y = 0.75, Rotation = 90, FlipY = true };
        Assert.True(ImageFrameTransform.TryParseCommandValue(t.ToCommandValue(), out var parsed));
        Assert.Equal(t, parsed);
    }
}

public class ConfigurationTests
{
    [Fact]
    public void Reads_v13_style_dictionary()
    {
        var config = ImageFrameConfiguration.From(new Dictionary<string, object>
        {
            ["width"] = "400",
            ["height"] = 100L,
            ["minZoom"] = "0.1",
            ["allowRotate"] = "0",
            ["allowFlip"] = true,
            ["background"] = "#FFF",
            ["outputFormat"] = "PNG",
        });

        Assert.Equal(400, config.Width);
        Assert.Equal(100, config.Height);
        Assert.Equal(0.1, config.MinZoom);
        Assert.False(config.AllowRotate);
        Assert.True(config.AllowFlip);
        Assert.False(config.IsTransparent);
        Assert.Equal("png", config.OutputFormat);
    }

    [Fact]
    public void Reads_v17_style_dictionary_with_json_values()
    {
        using var doc = JsonDocument.Parse("""{"width":320,"height":180,"outputFormat":["webp"],"allowFlip":false,"background":""}""");
        var dict = doc.RootElement.EnumerateObject().ToDictionary(p => p.Name, p => (object)p.Value.Clone());
        var config = ImageFrameConfiguration.From(dict);

        Assert.Equal(320, config.Width);
        Assert.Equal(180, config.Height);
        Assert.Equal("webp", config.OutputFormat);
        Assert.False(config.AllowFlip);
        Assert.True(config.IsTransparent);
    }

    [Fact]
    public void Falls_back_to_defaults() => Assert.Equal(new ImageFrameConfiguration(), ImageFrameConfiguration.From(null));
}

public class RenderTests
{
    private static readonly Rgba32 Red = new(255, 0, 0, 255);

    private static Image<Rgba32> Solid(int width, int height)
    {
        var image = new Image<Rgba32>(width, height);
        image.ProcessPixelRows(rows =>
        {
            for (var y = 0; y < rows.Height; y++)
            {
                rows.GetRowSpan(y).Fill(Red);
            }
        });
        return image;
    }

    [Fact]
    public void Contain_letterboxes_a_wide_logo_with_transparency()
    {
        // 400x100 logo in a 200x200 frame at zoom 1 -> 200x50 band in the middle.
        using var image = Solid(400, 100);
        ImageFrameWebProcessor.Render(image, ImageFrameTransform.Default, 200, 200, null);

        Assert.Equal(200, image.Width);
        Assert.Equal(200, image.Height);
        Assert.Equal(0, image[100, 10].A);   // above the band: transparent
        Assert.Equal(255, image[100, 100].A); // centre: logo
        Assert.Equal(255, image[100, 100].R);
        Assert.Equal(0, image[100, 190].A);  // below the band: transparent
    }

    [Fact]
    public void Zoom_out_adds_padding_on_all_sides()
    {
        using var image = Solid(200, 200);
        ImageFrameWebProcessor.Render(image, new ImageFrameTransform { Zoom = 0.5 }, 200, 200, "ffffff");

        Assert.Equal(new Rgba32(255, 255, 255, 255), image[10, 10]); // padding uses the background colour
        Assert.Equal(Red, image[100, 100]);
    }

    [Fact]
    public void Position_moves_the_image()
    {
        using var image = Solid(100, 100);
        ImageFrameWebProcessor.Render(image, new ImageFrameTransform { Zoom = 0.5, X = 0.25, Y = 0.25 }, 200, 200, null);

        Assert.Equal(255, image[50, 50].A);   // image centre moved to (50,50)
        Assert.Equal(0, image[150, 150].A);
    }

    [Fact]
    public void Rotation_by_90_swaps_orientation()
    {
        // A 400x100 bar rotated 90° in a 200x200 frame becomes vertical.
        using var image = Solid(400, 100);
        ImageFrameWebProcessor.Render(image, new ImageFrameTransform { Rotation = 90 }, 200, 200, null);

        Assert.Equal(255, image[100, 10].A);  // top centre now covered
        Assert.Equal(0, image[10, 100].A);    // left centre now empty
    }

    [Fact]
    public void Cover_zoom_fills_the_frame()
    {
        using var image = Solid(400, 100);
        ImageFrameWebProcessor.Render(image, new ImageFrameTransform { Zoom = 4 }, 200, 200, null);

        Assert.Equal(255, image[1, 1].A);
        Assert.Equal(255, image[198, 198].A);
    }
}
