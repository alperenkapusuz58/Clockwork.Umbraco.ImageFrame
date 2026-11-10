using System.Globalization;
using Clockwork.Umbraco.ImageFrame.Models;
using Clockwork.Umbraco.ImageFrame.Rendering;
using Umbraco.Cms.Core.Models.DeliveryApi;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.PropertyEditors.DeliveryApi;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.PublishedCache;
#if !NET10_0_OR_GREATER
using Umbraco.Extensions;
#endif

namespace Clockwork.Umbraco.ImageFrame.PropertyEditors;

public sealed class ImageFrameValueConverter : PropertyValueConverterBase, IDeliveryApiPropertyValueConverter
{
#if NET10_0_OR_GREATER
    private readonly IPublishedMediaCache _mediaCache;
#else
    private readonly IPublishedSnapshotAccessor _publishedSnapshotAccessor;
#endif
    private readonly IPublishedUrlProvider _urlProvider;
    private readonly IImageFrameUrlBuilder _urlBuilder;

    public ImageFrameValueConverter(
#if NET10_0_OR_GREATER
        IPublishedMediaCache mediaCache,
#else
        IPublishedSnapshotAccessor publishedSnapshotAccessor,
#endif
        IPublishedUrlProvider urlProvider,
        IImageFrameUrlBuilder urlBuilder)
    {
#if NET10_0_OR_GREATER
        _mediaCache = mediaCache;
#else
        _publishedSnapshotAccessor = publishedSnapshotAccessor;
#endif
        _urlProvider = urlProvider;
        _urlBuilder = urlBuilder;
    }

    public override bool IsConverter(IPublishedPropertyType propertyType)
        => propertyType.EditorAlias.Equals(ImageFrameConstants.PropertyEditorAlias, StringComparison.Ordinal);

    public override Type GetPropertyValueType(IPublishedPropertyType propertyType) => typeof(ImageFrameValue);

    public override PropertyCacheLevel GetPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Elements;

    public override bool? IsValue(object? value, PropertyValueLevel level) => level switch
    {
        PropertyValueLevel.Source => ImageFrameStoredValue.Parse(value) is not null,
        _ => value is ImageFrameValue { HasImage: true },
    };

    public override object? ConvertSourceToIntermediate(IPublishedElement owner, IPublishedPropertyType propertyType, object? source, bool preview)
        => ImageFrameStoredValue.Parse(source);

    public override object? ConvertIntermediateToObject(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object? inter, bool preview)
    {
        if (inter is not ImageFrameStoredValue stored)
        {
            return null;
        }

        var media = GetMedia(stored.MediaKey, preview);
        if (media is null)
        {
            return null;
        }

        var url = _urlProvider.GetMediaUrl(media);
        if (string.IsNullOrEmpty(url))
        {
            return null;
        }

#if NET10_0_OR_GREATER
        var configuration = ImageFrameConfiguration.From(propertyType.DataType.ConfigurationObject);
#else
        var configuration = ImageFrameConfiguration.From(propertyType.DataType.Configuration);
#endif
        return new ImageFrameValue(
            stored.MediaKey,
            media,
            url,
            stored.ToTransform(),
            configuration,
            stored.ImageWidth ?? GetInt(media, "umbracoWidth"),
            stored.ImageHeight ?? GetInt(media, "umbracoHeight"),
            _urlBuilder);
    }

    public PropertyCacheLevel GetDeliveryApiPropertyCacheLevel(IPublishedPropertyType propertyType) => PropertyCacheLevel.Elements;

    public Type GetDeliveryApiPropertyValueType(IPublishedPropertyType propertyType) => typeof(ImageFrameApiModel);

    public object? ConvertIntermediateToDeliveryApiObject(IPublishedElement owner, IPublishedPropertyType propertyType, PropertyCacheLevel referenceCacheLevel, object? inter, bool preview, bool expanding)
    {
        if (ConvertIntermediateToObject(owner, propertyType, referenceCacheLevel, inter, preview) is not ImageFrameValue value)
        {
            return null;
        }

        return new ImageFrameApiModel
        {
            MediaKey = value.MediaKey,
            Name = value.Name,
            Url = value.Url,
            Url2x = value.GetUrl(2),
            OriginalUrl = value.OriginalUrl,
            IsVector = value.IsVector,
            Width = value.Width,
            Height = value.Height,
            ImageWidth = value.ImageWidth,
            ImageHeight = value.ImageHeight,
            Zoom = value.Transform.Zoom,
            X = value.Transform.X,
            Y = value.Transform.Y,
            Rotation = value.Transform.Rotation,
            FlipX = value.Transform.FlipX,
            FlipY = value.Transform.FlipY,
            Background = value.Configuration.IsTransparent ? null : value.Configuration.Background,
        };
    }

    private IPublishedContent? GetMedia(Guid key, bool preview)
    {
#if NET10_0_OR_GREATER
        return _mediaCache.GetById(key);
#else
        return _publishedSnapshotAccessor.TryGetPublishedSnapshot(out var snapshot)
            ? snapshot?.Media?.GetById(preview, key)
            : null;
#endif
    }

    private static int? GetInt(IPublishedContent media, string alias)
    {
        var value = media.GetProperty(alias)?.GetSourceValue();
        return int.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture), NumberStyles.Integer, CultureInfo.InvariantCulture, out var result) && result > 0
            ? result
            : null;
    }
}

/// <summary>Content Delivery API representation of a Clockwork Image Frame value.</summary>
public sealed class ImageFrameApiModel
{
    public Guid MediaKey { get; init; }
    public string? Name { get; init; }

    /// <summary>Framed image at 1x (the original file for SVG; frame it with the transform values).</summary>
    public string? Url { get; init; }
    public string? Url2x { get; init; }
    public string? OriginalUrl { get; init; }
    public bool IsVector { get; init; }
    public int Width { get; init; }
    public int Height { get; init; }
    public int? ImageWidth { get; init; }
    public int? ImageHeight { get; init; }
    public double Zoom { get; init; }
    public double X { get; init; }
    public double Y { get; init; }
    public double Rotation { get; init; }
    public bool FlipX { get; init; }
    public bool FlipY { get; init; }
    public string? Background { get; init; }
}
