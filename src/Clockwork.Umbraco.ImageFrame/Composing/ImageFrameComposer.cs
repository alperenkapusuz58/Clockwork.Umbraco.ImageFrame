using Clockwork.Umbraco.ImageFrame.Imaging;
using Clockwork.Umbraco.ImageFrame.PropertyEditors;
using Clockwork.Umbraco.ImageFrame.Rendering;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SixLabors.ImageSharp.Web.Processors;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Extensions;

namespace Clockwork.Umbraco.ImageFrame.Composing;

public sealed class ImageFrameComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.TryAddSingleton<IImageFrameUrlBuilder, ImageFrameUrlBuilder>();
        builder.Services.TryAddEnumerable(ServiceDescriptor.Singleton<IImageWebProcessor, ImageFrameWebProcessor>());
        builder.DataValueReferenceFactories().Append<ImageFrameDataValueReferenceFactory>();
    }
}
