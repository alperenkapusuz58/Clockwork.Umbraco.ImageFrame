(function () {
    'use strict';

    var app = angular.module('umbraco');

    /* ------------------------------------------------------------------ *
     * Frame math - mirrors ImageFrameTransform.cs and frame-math.ts
     * ------------------------------------------------------------------ */
    app.factory('cwImageFrameMath', function () {
        var GUID = /([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})$/i;
        var IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'tif', 'tiff'];

        function toGuid(input) {
            if (typeof input !== 'string') return null;
            var m = GUID.exec(input.trim());
            if (!m) return null;
            var h = m[1].replace(/-/g, '').toLowerCase();
            return h.substr(0, 8) + '-' + h.substr(8, 4) + '-' + h.substr(12, 4) + '-' + h.substr(16, 4) + '-' + h.substr(20);
        }

        function createValue(mediaKey, imageWidth, imageHeight) {
            return { mediaKey: mediaKey, imageWidth: imageWidth || undefined, imageHeight: imageHeight || undefined, zoom: 1, x: 0.5, y: 0.5, rotation: 0, flipX: false, flipY: false };
        }

        function num(v, fallback) {
            return typeof v === 'number' && isFinite(v) ? v : fallback;
        }

        function parseValue(raw) {
            if (raw === null || raw === undefined || raw === '') return null;
            if (typeof raw === 'string') {
                var t = raw.trim();
                if (t[0] === '{' || t[0] === '[') {
                    try { return parseValue(JSON.parse(t)); } catch (e) { return null; }
                }
                var k = toGuid(t.split(',')[0]);
                return k ? createValue(k) : null;
            }
            if (angular.isArray(raw)) {
                for (var i = 0; i < raw.length; i++) {
                    var p = parseValue(raw[i]);
                    if (p) return p;
                }
                return null;
            }
            if (typeof raw === 'object') {
                var key = toGuid(raw.mediaKey) || toGuid(raw.udi);
                if (!key) return null;
                return {
                    mediaKey: key,
                    imageWidth: raw.imageWidth > 0 ? Math.round(raw.imageWidth) : undefined,
                    imageHeight: raw.imageHeight > 0 ? Math.round(raw.imageHeight) : undefined,
                    zoom: num(raw.zoom, 1),
                    x: num(raw.x, 0.5),
                    y: num(raw.y, 0.5),
                    rotation: num(raw.rotation, 0),
                    flipX: raw.flipX === true,
                    flipY: raw.flipY === true
                };
            }
            return null;
        }

        function readConfig(config) {
            config = config || {};
            function n(key, fallback) {
                var v = parseFloat(config[key]);
                return isFinite(v) && v > 0 ? v : fallback;
            }
            function b(key, fallback) {
                var v = config[key];
                if (v === undefined || v === null || v === '') return fallback;
                return v === true || v === 1 || v === '1' || v === 'true';
            }
            var minZoom = n('minZoom', 0.2);
            return {
                width: Math.round(n('width', 300)),
                height: Math.round(n('height', 150)),
                minZoom: minZoom,
                maxZoom: Math.max(minZoom, n('maxZoom', 4)),
                allowRotate: b('allowRotate', true),
                allowFlip: b('allowFlip', true),
                background: normalizeHex(config.background)
            };
        }

        function normalizeHex(input) {
            if (typeof input !== 'string') return null;
            var m = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
            if (!m) return null;
            var h = m[1].toLowerCase();
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            return '#' + h;
        }

        function baseScale(w, h, cfg) {
            if (!w || !h) return 1;
            return Math.min(cfg.width / w, cfg.height / h);
        }

        function coverZoom(w, h, cfg) {
            if (!w || !h) return 1;
            return Math.max(cfg.width / w, cfg.height / h) / baseScale(w, h, cfg);
        }

        function r(n) { return Math.round(n * 10000) / 10000; }

        function imageStyle(value, cfg, imageWidth, imageHeight) {
            var w = imageWidth || value.imageWidth || cfg.width;
            var h = imageHeight || value.imageHeight || cfg.height;
            var scale = baseScale(w, h, cfg) * value.zoom;
            return {
                position: 'absolute',
                left: r(value.x * 100) + '%',
                top: r(value.y * 100) + '%',
                width: r(scale * w / cfg.width * 100) + '%',
                height: r(scale * h / cfg.height * 100) + '%',
                'max-width': 'none',
                'max-height': 'none',
                transform: 'translate(-50%,-50%) rotate(' + r(value.rotation) + 'deg) scale(' + (value.flipX ? -1 : 1) + ',' + (value.flipY ? -1 : 1) + ')'
            };
        }

        function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

        function isImageUrl(url) {
            if (!url) return false;
            var ext = url.split(/[?#]/)[0].split('.').pop().toLowerCase();
            return IMAGE_EXTENSIONS.indexOf(ext) >= 0;
        }

        function loadImageSize(url, $q) {
            var d = $q.defer();
            var img = new Image();
            img.onload = function () { d.resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
            img.onerror = function () { d.resolve({ width: 0, height: 0 }); };
            img.src = url;
            return d.promise;
        }

        return {
            toGuid: toGuid,
            createValue: createValue,
            parseValue: parseValue,
            readConfig: readConfig,
            normalizeHex: normalizeHex,
            coverZoom: coverZoom,
            imageStyle: imageStyle,
            clamp: clamp,
            isImageUrl: isImageUrl,
            loadImageSize: loadImageSize
        };
    });

    /* ------------------------------------------------------------------ *
     * Property editor
     * ------------------------------------------------------------------ */
    app.controller('Clockwork.ImageFrame.PropertyEditorController', [
        '$scope', '$q', 'editorService', 'entityResource', 'mediaHelper', 'localizationService', 'cwImageFrameMath',
        function ($scope, $q, editorService, entityResource, mediaHelper, localizationService, math) {
            var vm = this;
            var PREVIEW_MAX_WIDTH = 320;
            var PREVIEW_MAX_HEIGHT = 200;

            vm.config = math.readConfig($scope.model.config);
            vm.value = math.parseValue($scope.model.value);
            vm.readonly = $scope.readonly === true || ($scope.model.config && $scope.model.config.readonly === true);
            vm.url = null;
            vm.name = null;
            vm.imageWidth = 0;
            vm.imageHeight = 0;
            vm.error = null;
            vm.loading = false;

            var k = Math.min(PREVIEW_MAX_WIDTH / vm.config.width, PREVIEW_MAX_HEIGHT / vm.config.height, 1);
            vm.previewStyle = { width: (vm.config.width * k) + 'px', height: (vm.config.height * k) + 'px' };
            if (vm.config.background) vm.previewStyle.background = vm.config.background;

            vm.imageStyle = function () {
                return vm.value ? math.imageStyle(vm.value, vm.config, vm.imageWidth, vm.imageHeight) : {};
            };

            function setValue(value) {
                vm.value = value;
                $scope.model.value = value ? angular.copy(value) : null;
                if ($scope.propertyForm) $scope.propertyForm.$setDirty();
            }

            function resolveMedia(key) {
                return entityResource.getById(key, 'Media').then(function (entity) {
                    return { url: mediaHelper.resolveFileFromEntity(entity, false), name: entity.name };
                }, function () {
                    return { url: null, name: null };
                });
            }

            function load() {
                vm.error = null;
                if (!vm.value) { vm.url = vm.name = null; return; }
                var key = vm.value.mediaKey;
                vm.loading = true;
                resolveMedia(key).then(function (media) {
                    if (!vm.value || vm.value.mediaKey !== key) return;
                    vm.url = media.url;
                    vm.name = media.name;
                    if (!media.url) {
                        localizationService.localize('clockworkImageFrame_missingMedia').then(function (t) { vm.error = t; });
                        vm.loading = false;
                        return;
                    }
                    math.loadImageSize(media.url, $q).then(function (size) {
                        vm.imageWidth = size.width;
                        vm.imageHeight = size.height;
                        vm.loading = false;
                    });
                });
            }

            vm.pick = function () {
                if (vm.readonly) return;
                editorService.mediaPicker({
                    multiPicker: false,
                    onlyImages: true,
                    disableFolderSelect: true,
                    submit: function (model) {
                        editorService.close();
                        var item = model.selection && model.selection[0];
                        var key = item && (math.toGuid(item.key) || math.toGuid(item.udi));
                        if (!key) return;
                        resolveMedia(key).then(function (media) {
                            if (!math.isImageUrl(media.url)) {
                                localizationService.localize('clockworkImageFrame_notAnImage').then(function (t) { vm.error = t; });
                                return;
                            }
                            math.loadImageSize(media.url, $q).then(function (size) {
                                vm.error = null;
                                vm.url = media.url;
                                vm.name = media.name;
                                vm.imageWidth = size.width;
                                vm.imageHeight = size.height;
                                setValue(math.createValue(key, size.width, size.height));
                            });
                        });
                    },
                    close: function () { editorService.close(); }
                });
            };

            vm.edit = function () {
                if (vm.readonly || !vm.value || !vm.url) return;
                localizationService.localize('clockworkImageFrame_editHeadline').then(function (title) {
                    editorService.open({
                        title: title,
                        view: '/App_Plugins/ClockworkImageFrame/v13/image-frame-editor.html',
                        size: 'large',
                        url: vm.url,
                        name: vm.name,
                        config: vm.config,
                        value: angular.copy(vm.value),
                        submit: function (value) {
                            value.mediaKey = vm.value.mediaKey;
                            if (value.imageWidth) vm.imageWidth = value.imageWidth;
                            if (value.imageHeight) vm.imageHeight = value.imageHeight;
                            setValue(value);
                            editorService.close();
                        },
                        close: function () { editorService.close(); }
                    });
                });
            };

            vm.remove = function () {
                vm.url = vm.name = null;
                setValue(null);
            };

            load();
        }
    ]);

    /* ------------------------------------------------------------------ *
     * Frame editor (infinite editing overlay)
     * ------------------------------------------------------------------ */
    app.controller('Clockwork.ImageFrame.EditorController', [
        '$scope', '$q', 'cwImageFrameMath',
        function ($scope, $q, math) {
            var vm = this;
            var model = $scope.model;
            var STAGE_PADDING = 48;

            vm.config = model.config;
            vm.url = model.url;
            vm.value = model.value;
            vm.imageWidth = 0;
            vm.imageHeight = 0;
            vm.stage = { width: 640, height: 420 };

            math.loadImageSize(vm.url, $q).then(function (size) {
                vm.imageWidth = size.width;
                vm.imageHeight = size.height;
                if (size.width && size.height) {
                    vm.value.imageWidth = size.width;
                    vm.value.imageHeight = size.height;
                }
            });

            vm.displayScale = function () {
                return Math.min((vm.stage.width - STAGE_PADDING * 2) / vm.config.width, (vm.stage.height - STAGE_PADDING * 2) / vm.config.height, 4);
            };

            vm.frameStyle = function () {
                var k = vm.displayScale();
                var s = { width: (vm.config.width * k) + 'px', height: (vm.config.height * k) + 'px' };
                if (vm.config.background) s.background = vm.config.background;
                return s;
            };

            vm.maskStyle = function () {
                var k = vm.displayScale();
                return { width: (vm.config.width * k) + 'px', height: (vm.config.height * k) + 'px' };
            };

            vm.imageStyle = function () {
                return math.imageStyle(vm.value, vm.config, vm.imageWidth, vm.imageHeight);
            };

            vm.setZoom = function (zoom) {
                vm.value.zoom = math.clamp(zoom, vm.config.minZoom, vm.config.maxZoom);
                vm.zoomSlider = Math.log(vm.value.zoom);
            };

            vm.zoomMin = Math.log(vm.config.minZoom);
            vm.zoomMax = Math.log(vm.config.maxZoom);
            vm.zoomSlider = Math.log(vm.value.zoom);
            vm.onZoomSlider = function () { vm.value.zoom = math.clamp(Math.exp(parseFloat(vm.zoomSlider)), vm.config.minZoom, vm.config.maxZoom); };
            vm.zoomPercent = function () { return Math.round(vm.value.zoom * 100); };

            vm.move = function (dxPx, dyPx, start) {
                var k = vm.displayScale();
                vm.value.x = math.clamp(start.x + dxPx / (vm.config.width * k), -1, 2);
                vm.value.y = math.clamp(start.y + dyPx / (vm.config.height * k), -1, 2);
            };

            vm.nudge = function (dx, dy) {
                vm.value.x += dx;
                vm.value.y += dy;
            };

            vm.fit = function () {
                vm.setZoom(1);
                vm.value.x = vm.value.y = 0.5;
            };

            vm.fill = function () {
                vm.setZoom(math.coverZoom(vm.imageWidth, vm.imageHeight, vm.config));
                vm.value.x = vm.value.y = 0.5;
            };

            vm.center = function () { vm.value.x = vm.value.y = 0.5; };

            function quarter() { return Math.round(vm.value.rotation / 90) * 90; }
            vm.fineRotation = vm.value.rotation - quarter();
            vm.onRotationSlider = function () { vm.value.rotation = quarter() + parseFloat(vm.fineRotation); };
            vm.rotateBy = function (delta) {
                var next = Math.round((vm.value.rotation + delta) * 100) / 100;
                vm.value.rotation = ((next % 360) + 540) % 360 - 180;
                vm.fineRotation = vm.value.rotation - quarter();
            };
            vm.rotationLabel = function () { return Math.round(vm.value.rotation * 10) / 10; };

            vm.toggleFlipX = function () { vm.value.flipX = !vm.value.flipX; };
            vm.toggleFlipY = function () { vm.value.flipY = !vm.value.flipY; };

            vm.reset = function () {
                vm.value.rotation = 0;
                vm.value.flipX = vm.value.flipY = false;
                vm.fineRotation = 0;
                vm.fit();
            };

            vm.submit = function () { if (model.submit) model.submit(vm.value); };
            vm.close = function () { if (model.close) model.close(); };
        }
    ]);

    /* ------------------------------------------------------------------ *
     * Stage interactions: drag, wheel zoom, keyboard nudge, resize
     * ------------------------------------------------------------------ */
    app.directive('cwImageFrameStage', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                var vm = scope.vm;
                var el = element[0];
                var drag = null;

                function measure() {
                    var rect = el.getBoundingClientRect();
                    if (rect.width > 0) {
                        vm.stage.width = rect.width;
                        vm.stage.height = rect.height;
                    }
                }

                var observer = typeof ResizeObserver !== 'undefined'
                    ? new ResizeObserver(function () { scope.$applyAsync(measure); })
                    : null;
                if (observer) observer.observe(el);
                scope.$applyAsync(measure);

                el.addEventListener('pointerdown', function (e) {
                    if (e.button !== 0) return;
                    el.setPointerCapture(e.pointerId);
                    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, start: { x: vm.value.x, y: vm.value.y } };
                });
                el.addEventListener('pointermove', function (e) {
                    if (!drag || drag.id !== e.pointerId) return;
                    scope.$apply(function () { vm.move(e.clientX - drag.sx, e.clientY - drag.sy, drag.start); });
                });
                function end(e) { if (drag && drag.id === e.pointerId) drag = null; }
                el.addEventListener('pointerup', end);
                el.addEventListener('pointercancel', end);
                el.addEventListener('wheel', function (e) {
                    e.preventDefault();
                    scope.$apply(function () { vm.setZoom(vm.value.zoom * Math.exp(-e.deltaY * 0.0015)); });
                }, { passive: false });
                el.addEventListener('keydown', function (e) {
                    var step = e.shiftKey ? 0.05 : 0.005;
                    var moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
                    var m = moves[e.key];
                    if (m) {
                        e.preventDefault();
                        scope.$apply(function () { vm.nudge(m[0], m[1]); });
                    } else if (e.key === '+' || e.key === '=') {
                        scope.$apply(function () { vm.setZoom(vm.value.zoom * 1.05); });
                    } else if (e.key === '-') {
                        scope.$apply(function () { vm.setZoom(vm.value.zoom / 1.05); });
                    }
                });

                scope.$on('$destroy', function () { if (observer) observer.disconnect(); });
            }
        };
    });
})();
