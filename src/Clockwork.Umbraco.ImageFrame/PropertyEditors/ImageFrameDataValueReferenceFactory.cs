using Clockwork.Umbraco.ImageFrame.Models;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.Editors;
using Umbraco.Cms.Core.PropertyEditors;

namespace Clockwork.Umbraco.ImageFrame.PropertyEditors;

/// <summary>Tracks the picked media so Umbraco's "Referenced by" and delete warnings work.</summary>
public sealed class ImageFrameDataValueReferenceFactory : IDataValueReferenceFactory, IDataValueReference
{
    public IDataValueReference GetDataValueReference() => this;

    public bool IsForEditor(IDataEditor? dataEditor)
        => dataEditor?.Alias.Equals(ImageFrameConstants.PropertyEditorAlias, StringComparison.Ordinal) == true;

    public IEnumerable<UmbracoEntityReference> GetReferences(object? value)
    {
        var stored = ImageFrameStoredValue.Parse(value);
        if (stored is null)
        {
            yield break;
        }

        yield return new UmbracoEntityReference(new GuidUdi(Constants.UdiEntityType.Media, stored.MediaKey));
    }
}
