using Clockwork.Umbraco.ImageFrame.Models;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace Clockwork.Umbraco.ImageFrame.Rendering;

public static class ImageFrameHtmlHelperExtensions
{
    /// <summary>Renders a Clockwork Image Frame value. Returns empty content when the value is null.</summary>
    public static IHtmlContent ImageFrame(
        this IHtmlHelper html,
        ImageFrameValue? value,
        string? alt = null,
        string? cssClass = null,
        bool lazy = true,
        object? htmlAttributes = null)
    {
        if (value is null)
        {
            return HtmlString.Empty;
        }

        IDictionary<string, string?>? attributes = null;
        if (htmlAttributes is not null)
        {
            attributes = HtmlHelper.AnonymousObjectToHtmlAttributes(htmlAttributes)
                .ToDictionary(x => x.Key, x => x.Value?.ToString());
        }

        return value.ToHtml(alt, cssClass, lazy, attributes);
    }
}
