using System.Globalization;
using Clockwork.Umbraco.ImageFrame.Models;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp.Web;
using SixLabors.ImageSharp.Web.Middleware;

namespace Clockwork.Umbraco.ImageFrame.Rendering;

public interface IImageFrameUrlBuilder
{
    /// <summary>Builds an ImageSharp URL that renders <paramref name="mediaUrl"/> inside the frame at the given pixel size.</summary>
    string BuildUrl(string mediaUrl, ImageFrameTransform transform, ImageFrameConfiguration configuration, int width, int height, string? format = null);
}

internal sealed class ImageFrameUrlBuilder : IImageFrameUrlBuilder
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IOptions<ImageSharpMiddlewareOptions> _middlewareOptions;

    public ImageFrameUrlBuilder(IServiceProvider serviceProvider, IOptions<ImageSharpMiddlewareOptions> middlewareOptions)
    {
        _serviceProvider = serviceProvider;
        _middlewareOptions = middlewareOptions;
    }

    public string BuildUrl(string mediaUrl, ImageFrameTransform transform, ImageFrameConfiguration configuration, int width, int height, string? format = null)
    {
        var query = new Dictionary<string, string?>
        {
            [ImageFrameConstants.FrameCommand] = transform.ToCommandValue(),
            [ImageFrameConstants.SizeCommand] = string.Create(CultureInfo.InvariantCulture, $"{width},{height}"),
        };

        var background = ColorHelper.NormalizeHex(configuration.Background);
        if (background is not null)
        {
            query[ImageFrameConstants.BackgroundCommand] = background;
        }

        format ??= configuration.OutputFormat;
        if (format is "webp" or "png" or "jpg" or "jpeg" or "gif")
        {
            query["format"] = format;
        }

        if (format is "webp" or "jpg" or "jpeg")
        {
            query["quality"] = configuration.Quality.ToString(CultureInfo.InvariantCulture);
        }

        var url = QueryHelpers.AddQueryString(mediaUrl, query);

        // Sign the URL when the site requires HMAC-protected image requests (Umbraco:CMS:Imaging:HMACSecretKey).
        var secret = _middlewareOptions.Value.HMACSecretKey;
        if (secret is { Length: > 0 }
            && _serviceProvider.GetService<RequestAuthorizationUtilities>() is { } authorization)
        {
            var token = authorization.ComputeHMAC(url, CommandHandling.Sanitize);
            if (!string.IsNullOrEmpty(token))
            {
                url = QueryHelpers.AddQueryString(url, RequestAuthorizationUtilities.TokenCommand, token);
            }
        }

        return url;
    }
}
