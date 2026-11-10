#if NET10_0_OR_GREATER
using Umbraco.Cms.Core.PropertyEditors;

namespace Clockwork.Umbraco.ImageFrame.PropertyEditors;

/// <summary>
/// Server-side schema for Umbraco 17+. On Umbraco 13 the editor is declared in package.manifest instead.
/// </summary>
[DataEditor(ImageFrameConstants.PropertyEditorAlias, ValueType = ValueTypes.Json, ValueEditorIsReusable = true)]
public sealed class ImageFramePropertyEditor : DataEditor
{
    public ImageFramePropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : base(dataValueEditorFactory)
        => SupportsReadOnly = true;
}
#endif
