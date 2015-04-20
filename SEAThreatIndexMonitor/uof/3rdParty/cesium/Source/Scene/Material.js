/*global define*/
define([
        '../Core/Cartesian2',
        '../Core/clone',
        '../Core/Color',
        '../Core/combine',
        '../Core/createGuid',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/isArray',
        '../Core/loadImage',
        '../Core/Matrix2',
        '../Core/Matrix3',
        '../Core/Matrix4',
        '../Renderer/CubeMap',
        '../Renderer/Texture',
        '../Shaders/Materials/BumpMapMaterial',
        '../Shaders/Materials/CheckerboardMaterial',
        '../Shaders/Materials/DotMaterial',
        '../Shaders/Materials/FadeMaterial',
        '../Shaders/Materials/GridMaterial',
        '../Shaders/Materials/NormalMapMaterial',
        '../Shaders/Materials/PolylineArrowMaterial',
        '../Shaders/Materials/PolylineGlowMaterial',
        '../Shaders/Materials/PolylineOutlineMaterial',
        '../Shaders/Materials/RimLightingMaterial',
        '../Shaders/Materials/StripeMaterial',
        '../Shaders/Materials/Water',
        '../ThirdParty/when'
    ], function(
        Cartesian2,
        clone,
        Color,
        combine,
        createGuid,
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        isArray,
        loadImage,
        Matrix2,
        Matrix3,
        Matrix4,
        CubeMap,
        Texture,
        BumpMapMaterial,
        CheckerboardMaterial,
        DotMaterial,
        FadeMaterial,
        GridMaterial,
        NormalMapMaterial,
        PolylineArrowMaterial,
        PolylineGlowMaterial,
        PolylineOutlineMaterial,
        RimLightingMaterial,
        StripeMaterial,
        WaterMaterial,
        when) {
    "use strict";

    /**
     * A Material defines surface appearance through a combination of diffuse, specular,
     * normal, emission, and alpha components. These values are specified using a
     * JSON schema called Fabric which gets parsed and assembled into glsl shader code
     * behind-the-scenes. Check out the {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|wiki page}
     * for more details on Fabric.
     * <br /><br />
     * <style type="text/css">
     *  #materialDescriptions code {
     *      font-weight: normal;
     *      font-family: Consolas, 'Lucida Console', Monaco, monospace;
     *      color: #A35A00;
     *  }
     *  #materialDescriptions ul, #materialDescriptions ul ul {
     *      list-style-type: none;
     *  }
     *  #materialDescriptions ul ul {
     *      margin-bottom: 10px;
     *  }
     *  #materialDescriptions ul ul li {
     *      font-weight: normal;
     *      color: #000000;
     *      text-indent: -2em;
     *      margin-left: 2em;
     *  }
     *  #materialDescriptions ul li {
     *      font-weight: bold;
     *      color: #0053CF;
     *  }
     * </style>
     *
     * Base material types and their uniforms:
     * <div id='materialDescriptions'>
     * <ul>
     *  <li>Color</li>
     *  <ul>
     *      <li><code>color</code>:  rgba color object.</li>
     *  </ul>
     *  <li>Image</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>DiffuseMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>AlphaMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channel</code>:  One character string containing r, g, b, or a for selecting the desired image channel. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>SpecularMap</li>
     *  <ul>
     *      <li><code>image</code>: path to image.</li>
     *      <li><code>channel</code>: One character string containing r, g, b, or a for selecting the desired image channel. </li>
     *      <li><code>repeat</code>: Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>EmissionMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *  </ul>
     *  <li>BumpMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channel</code>:  One character string containing r, g, b, or a for selecting the desired image channel. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *      <li><code>strength</code>:  Bump strength value between 0.0 and 1.0 where 0.0 is small bumps and 1.0 is large bumps.</li>
     *  </ul>
     *  <li>NormalMap</li>
     *  <ul>
     *      <li><code>image</code>:  path to image.</li>
     *      <li><code>channels</code>:  Three character string containing any combination of r, g, b, and a for selecting the desired image channels. </li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of times to repeat the image.</li>
     *      <li><code>strength</code>:  Bump strength value between 0.0 and 1.0 where 0.0 is small bumps and 1.0 is large bumps.</li>
     *  </ul>
     *  <li>Grid</li>
     *  <ul>
     *      <li><code>color</code>:  rgba color object for the whole material.</li>
     *      <li><code>cellAlpha</code>: Alpha value for the cells between grid lines.  This will be combined with color.alpha.</li>
     *      <li><code>lineCount</code>:  Object with x and y values specifying the number of columns and rows respectively.</li>
     *      <li><code>lineThickness</code>:  Object with x and y values specifying the thickness of grid lines (in pixels where available).</li>
     *      <li><code>lineOffset</code>:  Object with x and y values specifying the offset of grid lines (range is 0 to 1).</li>
     *  </ul>
     *  <li>Stripe</li>
     *  <ul>
     *      <li><code>horizontal</code>:  Boolean that determines if the stripes are horizontal or vertical.</li>
     *      <li><code>evenColor</code>:  rgba color object for the stripe's first color.</li>
     *      <li><code>oddColor</code>:  rgba color object for the stripe's second color.</li>
     *      <li><code>offset</code>:  Number that controls at which point into the pattern to begin drawing; with 0.0 being the beginning of the even color, 1.0 the beginning of the odd color, 2.0 being the even color again, and any multiple or fractional values being in between.</li>
     *      <li><code>repeat</code>:  Number that controls the total number of stripes, half light and half dark.</li>
     *  </ul>
     *  <li>Checkerboard</li>
     *  <ul>
     *      <li><code>lightColor</code>:  rgba color object for the checkerboard's light alternating color.</li>
     *      <li><code>darkColor</code>: rgba color object for the checkerboard's dark alternating color.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of columns and rows respectively.</li>
     *  </ul>
     *  <li>Dot</li>
     *  <ul>
     *      <li><code>lightColor</code>:  rgba color object for the dot color.</li>
     *      <li><code>darkColor</code>:  rgba color object for the background color.</li>
     *      <li><code>repeat</code>:  Object with x and y values specifying the number of columns and rows of dots respectively.</li>
     *  </ul>
     *  <li>Water</li>
     *  <ul>
     *      <li><code>baseWaterColor</code>:  rgba color object base color of the water.</li>
     *      <li><code>blendColor</code>:  rgba color object used when blending from water to non-water areas.</li>
     *      <li><code>specularMap</code>:  Single channel texture used to indicate areas of water.</li>
     *      <li><code>normalMap</code>:  Normal map for water normal perturbation.</li>
     *      <li><code>frequency</code>:  Number that controls the number of waves.</li>
     *      <li><code>normalMap</code>:  Normal map for water normal perturbation.</li>
     *      <li><code>animationSpeed</code>:  Number that controls the animations speed of the water.</li>
     *      <li><code>amplitude</code>:  Number that controls the amplitude of water waves.</li>
     *      <li><code>specularIntensity</code>:  Number that controls the intensity of specular reflections.</li>
     *  </ul>
     *  <li>RimLighting</li>
     *  <ul>
     *      <li><code>color</code>:  diffuse color and alpha.</li>
     *      <li><code>rimColor</code>:  diffuse color and alpha of the rim.</li>
     *      <li><code>width</code>:  Number that determines the rim's width.</li>
     *  </ul>
     *  <li>Fade</li>
     *  <ul>
     *      <li><code>fadeInColor</code>: diffuse color and alpha at <code>time</code></li>
     *      <li><code>fadeOutColor</code>: diffuse color and alpha at <code>maximumDistance</code> from <code>time</code></li>
     *      <li><code>maximumDistance</code>: Number between 0.0 and 1.0 where the <code>fadeInColor</code> becomes the <code>fadeOutColor</code>. A value of 0.0 gives the entire material a color of <code>fadeOutColor</code> and a value of 1.0 gives the the entire material a color of <code>fadeInColor</code></li>
     *      <li><code>repeat</code>: true if the fade should wrap around the texture coodinates.</li>
     *      <li><code>fadeDirection</code>: Object with x and y values specifying if the fade should be in the x and y directions.</li>
     *      <li><code>time</code>: Object with x and y values between 0.0 and 1.0 of the <code>fadeInColor</code> position</li>
     *  </ul>
     *  <li>PolylineArrow</li>
     *  <ul>
     *      <li><code>color</code>: diffuse color and alpha.</li>
     *  </ul>
     *  <li>PolylineGlow</li>
     *  <ul>
     *      <li><code>color</code>: color and maximum alpha for the glow on the line.</li>
     *      <li><code>glowPower</code>: strength of the glow, as a percentage of the total line width (less than 1.0).</li>
     *  </ul>
     *  <li>PolylineOutline</li>
     *  <ul>
     *      <li><code>color</code>: diffuse color and alpha for the interior of the line.</li>
     *      <li><code>outlineColor</code>: diffuse color and alpha for the outline.</li>
     *      <li><code>outlineWidth</code>: width of the outline in pixels.</li>
     *  </ul>
     * </ul>
     * </div>
     *
     * @alias Material
     *
     * @param {Object} [options] Object with the following properties:
     * @param {Boolean} [options.strict=false] Throws errors for issues that would normally be ignored, including unused uniforms or materials.
     * @param {Boolean|Function} [options.translucent=true] When <code>true</code> or a function that returns <code>true</code>, the geometry
     *                           with this material is expected to appear translucent.
     * @param {Object} options.fabric The fabric JSON used to generate the material.
     *
     * @constructor
     *
     * @exception {DeveloperError} fabric: uniform has invalid type.
     * @exception {DeveloperError} fabric: uniforms and materials cannot share the same property.
     * @exception {DeveloperError} fabric: cannot have source and components in the same section.
     * @exception {DeveloperError} fabric: property name is not valid. It should be 'type', 'materials', 'uniforms', 'components', or 'source'.
     * @exception {DeveloperError} fabric: property name is not valid. It should be 'diffuse', 'specular', 'shininess', 'normal', 'emission', or 'alpha'.
     * @exception {DeveloperError} strict: shader source does not use string.
     * @exception {DeveloperError} strict: shader source does not use uniform.
     * @exception {DeveloperError} strict: shader source does not use material.
     *
     * @see {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric wiki page} for a more detailed options of Fabric.
     *
     * @demo {@link http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Materials.html|Cesium Sandcastle Materials Demo}
     *
     * @example
     * // Create a color material with fromType:
     * polygon.material = Cesium.Material.fromType('Color');
     * polygon.material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
     *
     * // Create the default material:
     * polygon.material = new Cesium.Material();
     *
     * // Create a color material with full Fabric notation:
     * polygon.material = new Cesium.Material({
     *     fabric : {
     *         type : 'Color',
     *         uniforms : {
     *             color : new Cesium.Color(1.0, 1.0, 0.0, 1.0)
     *         }
     *     }
     * });
     */
    var Material = function(options) {
        /**
         * The material type. Can be an existing type or a new type. If no type is specified in fabric, type is a GUID.
         * @type {String}
         * @default undefined
         */
        this.type = undefined;

        /**
         * The glsl shader source for this material.
         * @type {String}
         * @default undefined
         */
        this.shaderSource = undefined;

        /**
         * Maps sub-material names to Material objects.
         * @type {Object}
         * @default undefined
         */
        this.materials = undefined;

        /**
         * Maps uniform names to their values.
         * @type {Object}
         * @default undefined
         */
        this.uniforms = undefined;
        this._uniforms = undefined;

        /**
         * When <code>true</code> or a function that returns <code>true</code>,
         * the geometry is expected to appear translucent.
         * @type {Boolean|Function}
         * @default undefined
         */
        this.translucent = undefined;

        this._strict = undefined;
        this._template = undefined;
        this._count = undefined;

        this._texturePaths = {};
        this._loadedImages = [];
        this._loadedCubeMaps = [];

        this._textures = {};

        this._updateFunctions = [];

        initializeMaterial(options, this);
        defineProperties(this, {
            type : {
                value : this.type,
                writable : false
            }
        });

        if (!defined(Material._uniformList[this.type])) {
            Material._uniformList[this.type] = Object.keys(this._uniforms);
        }
    };

    // Cached list of combined uniform names indexed by type.
    // Used to get the list of uniforms in the same order.
    Material._uniformList = {};

    /**
     * Creates a new material using an existing material type.
     * <br /><br />
     * Shorthand for: new Material({fabric : {type : type}});
     *
     * @param {String} type The base material type.
     * @param {Object} [uniforms] Overrides for the default uniforms.
     * @returns {Material} New material object.
     *
     * @exception {DeveloperError} material with that type does not exist.
     *
     * @example
     * var material = Cesium.Material.fromType('Color', {
     *     color : new Cesium.Color(1.0, 0.0, 0.0, 1.0)
     * });
     */
    Material.fromType = function(type, uniforms) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(Material._materialCache.getMaterial(type))) {
            throw new DeveloperError('material with type \'' + type + '\' does not exist.');
        }
        //>>includeEnd('debug');

        var material = new Material({
            fabric : {
                type : type
            }
        });

        if (defined(uniforms)) {
            for (var name in uniforms) {
                if (uniforms.hasOwnProperty(name)) {
                    material.uniforms[name] = uniforms[name];
                }
            }
        }

        return material;
    };

    /**
     * Gets whether or not this material is translucent.
     * @returns <code>true</code> if this material is translucent, <code>false</code> otherwise.
     */
    Material.prototype.isTranslucent = function() {
        if (defined(this.translucent)) {
            if (typeof this.translucent === 'function') {
                return this.translucent();
            }

            return this.translucent;
        }

        var translucent = true;
        var funcs = this._translucentFunctions;
        var length = funcs.length;
        for (var i = 0; i < length; ++i) {
            var func = funcs[i];
            if (typeof func === 'function') {
                translucent = translucent && func();
            } else {
                translucent = translucent && func;
            }

            if (!translucent) {
                break;
            }
        }
        return translucent;
    };

    /**
     * @private
     */
    Material.prototype.update = function(context) {
        var i;
        var uniformId;

        var loadedImages = this._loadedImages;
        var length = loadedImages.length;

        for (i = 0; i < length; ++i) {
            var loadedImage = loadedImages[i];
            uniformId = loadedImage.id;
            var image = loadedImage.image;

            var texture = Material._textureCache.getTexture(this._texturePaths[uniformId]);
            if (!defined(texture)) {
                texture = context.createTexture2D({
                    source : image
                });
                Material._textureCache.addTexture(this._texturePaths[uniformId], texture);
            }

            this._textures[uniformId] = texture;

            var uniformDimensionsName = uniformId + 'Dimensions';
            if (this.uniforms.hasOwnProperty(uniformDimensionsName)) {
                var uniformDimensions = this.uniforms[uniformDimensionsName];
                uniformDimensions.x = texture._width;
                uniformDimensions.y = texture._height;
            }
        }

        loadedImages.length = 0;

        var loadedCubeMaps = this._loadedCubeMaps;
        length = loadedCubeMaps.length;

        for (i = 0; i < length; ++i) {
            var loadedCubeMap = loadedCubeMaps[i];
            uniformId = loadedCubeMap.id;
            var images = loadedCubeMap.images;

            var cubeMap = Material._textureCache.getTexture(this._texturePaths[uniformId]);
            if (!defined(cubeMap)) {
                cubeMap = context.createCubeMap({
                    source : {
                        positiveX : images[0],
                        negativeX : images[1],
                        positiveY : images[2],
                        negativeY : images[3],
                        positiveZ : images[4],
                        negativeZ : images[5]
                    }
                });
                Material._textureCache.addTexture(this._texturePaths[uniformId], cubeMap);
            }

            this._textures[uniformId] = cubeMap;
        }

        loadedCubeMaps.length = 0;

        var updateFunctions = this._updateFunctions;
        length = updateFunctions.length;
        for (i = 0; i < length; ++i) {
            updateFunctions[i](this, context);
        }

        var subMaterials = this.materials;
        for (var name in subMaterials) {
            if (subMaterials.hasOwnProperty(name)) {
                subMaterials[name].update(context);
            }
        }
    };

    /**
    * Returns true if this object was destroyed; otherwise, false.
    * <br /><br />
    * If this object was destroyed, it should not be used; calling any function other than
    * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
    *
    * @returns {Boolean} True if this object was destroyed; otherwise, false.
    *
    * @see Material#destroy
    */
    Material.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
     * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
     * <br /><br />
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     *
     * @returns {undefined}
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see Material#isDestroyed
     *
     * @example
     * material = material && material.destroy();
     */
    Material.prototype.destroy = function() {
        var materials = this.materials;
        var uniforms = this.uniforms;
        for ( var uniformId in uniforms) {
            if (uniforms.hasOwnProperty(uniformId)) {
                var path = this._texturePaths[uniformId];
                Material._textureCache.releaseTexture(path);
            }
        }
        for ( var material in materials) {
            if (materials.hasOwnProperty(material)) {
                materials[material].destroy();
            }
        }
        return destroyObject(this);
    };

    function initializeMaterial(options, result) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        result._strict = defaultValue(options.strict, false);
        result._count = defaultValue(options.count, 0);
        result._template = clone(defaultValue(options.fabric, defaultValue.EMPTY_OBJECT));
        result._template.uniforms = clone(defaultValue(result._template.uniforms, defaultValue.EMPTY_OBJECT));
        result._template.materials = clone(defaultValue(result._template.materials, defaultValue.EMPTY_OBJECT));

        result.type = defined(result._template.type) ? result._template.type : createGuid();

        result.shaderSource = '';
        result.materials = {};
        result.uniforms = {};
        result._uniforms = {};
        result._translucentFunctions = [];

        var translucent;

        // If the cache contains this material type, build the material template off of the stored template.
        var cachedMaterial = Material._materialCache.getMaterial(result.type);
        if (defined(cachedMaterial)) {
            var template = clone(cachedMaterial.fabric, true);
            result._template = combine(result._template, template, true);
            translucent = cachedMaterial.translucent;
        }

        // Make sure the template has no obvious errors. More error checking happens later.
        checkForTemplateErrors(result);

        // If the material has a new type, add it to the cache.
        if (!defined(cachedMaterial)) {
            Material._materialCache.addMaterial(result.type, result);
        }

        createMethodDefinition(result);
        createUniforms(result);
        createSubMaterials(result);

        var defaultTranslucent = result._translucentFunctions.length === 0 ? true : undefined;
        translucent = defaultValue(translucent, defaultTranslucent);
        translucent = defaultValue(options.translucent, translucent);

        if (defined(translucent)) {
            if (typeof translucent === 'function') {
                var wrappedTranslucent = function() {
                    return translucent(result);
                };
                result._translucentFunctions.push(wrappedTranslucent);
            } else {
                result._translucentFunctions.push(translucent);
            }

        }
    }

    function checkForValidProperties(object, properties, result, throwNotFound) {
        if (defined(object)) {
            for ( var property in object) {
                if (object.hasOwnProperty(property)) {
                    var hasProperty = properties.indexOf(property) !== -1;
                    if ((throwNotFound && !hasProperty) || (!throwNotFound && hasProperty)) {
                        result(property, properties);
                    }
                }
            }
        }
    }

    function invalidNameError(property, properties) {
        var errorString = 'fabric: property name \'' + property + '\' is not valid. It should be ';
        for ( var i = 0; i < properties.length; i++) {
            var propertyName = '\'' + properties[i] + '\'';
            errorString += (i === properties.length - 1) ? ('or ' + propertyName + '.') : (propertyName + ', ');
        }
        throw new DeveloperError(errorString);
    }

    function duplicateNameError(property, properties) {
        var errorString = 'fabric: uniforms and materials cannot share the same property \'' + property + '\'';
        throw new DeveloperError(errorString);
    }

    var templateProperties = ['type', 'materials', 'uniforms', 'components', 'source'];
    var componentProperties = ['diffuse', 'specular', 'shininess', 'normal', 'emission', 'alpha'];

    function checkForTemplateErrors(material) {
        var template = material._template;
        var uniforms = template.uniforms;
        var materials = template.materials;
        var components = template.components;

        // Make sure source and components do not exist in the same template.
        if (defined(components) && defined(template.source)) {
            throw new DeveloperError('fabric: cannot have source and components in the same template.');
        }

        // Make sure all template and components properties are valid.
        checkForValidProperties(template, templateProperties, invalidNameError, true);
        checkForValidProperties(components, componentProperties, invalidNameError, true);

        // Make sure uniforms and materials do not share any of the same names.
        var materialNames = [];
        for ( var property in materials) {
            if (materials.hasOwnProperty(property)) {
                materialNames.push(property);
            }
        }
        checkForValidProperties(uniforms, materialNames, duplicateNameError, false);
    }

    // Create the czm_getMaterial method body using source or components.
    function createMethodDefinition(material) {
        var components = material._template.components;
        var source = material._template.source;
        if (defined(source)) {
            material.shaderSource += source + '\n';
        } else {
            material.shaderSource += 'czm_material czm_getMaterial(czm_materialInput materialInput)\n{\n';
            material.shaderSource += 'czm_material material = czm_getDefaultMaterial(materialInput);\n';
            if (defined(components)) {
                for ( var component in components) {
                    if (components.hasOwnProperty(component)) {
                        material.shaderSource += 'material.' + component + ' = ' + components[component] + ';\n';
                    }
                }
            }
            material.shaderSource += 'return material;\n}\n';
        }
    }

    var matrixMap = {
        'mat2' : Matrix2,
        'mat3' : Matrix3,
        'mat4' : Matrix4
    };

    function createTexture2DUpdateFunction(uniformId) {
        return function(material, context) {
            var uniforms = material.uniforms;
            var uniformValue = uniforms[uniformId];
            var texture = material._textures[uniformId];

            var uniformDimensionsName;
            var uniformDimensions;

            if (uniformValue instanceof Texture && uniformValue !== texture) {
                Material._textureCache.releaseTexture(material._texturePaths[uniformId]);
                material._texturePaths[uniformId] = undefined;
                material._textures[uniformId] = uniformValue;

                uniformDimensionsName = uniformId + 'Dimensions';
                if (uniforms.hasOwnProperty(uniformDimensionsName)) {
                    uniformDimensions = uniforms[uniformDimensionsName];
                    uniformDimensions.x = uniformValue._width;
                    uniformDimensions.y = uniformValue._height;
                }

                return;
            }

            if (!defined(texture)) {
                material._texturePaths[uniformId] = undefined;
                texture = material._textures[uniformId] = context.defaultTexture;

                uniformDimensionsName = uniformId + 'Dimensions';
                if (uniforms.hasOwnProperty(uniformDimensionsName)) {
                    uniformDimensions = uniforms[uniformDimensionsName];
                    uniformDimensions.x = texture._width;
                    uniformDimensions.y = texture._height;
                }
            }

            if (uniformValue === Material.DefaultImageId) {
                return;
            }

            if (uniformValue !== material._texturePaths[uniformId]) {
                var newTexture = Material._textureCache.getTexture(uniformValue);
                if (defined(newTexture)) {
                    Material._textureCache.releaseTexture(material._texturePaths[uniformId]);
                    material._textures[uniformId] = newTexture;
                } else {
                    when(loadImage(uniformValue), function(image) {
                        material._loadedImages.push({
                            id : uniformId,
                            image : image
                        });
                    });
                }

                material._texturePaths[uniformId] = uniformValue;
            }
        };
    }

    function createCubeMapUpdateFunction(uniformId) {
        return function(material, context) {
            var uniformValue = material.uniforms[uniformId];

            if (uniformValue instanceof CubeMap) {
                Material._textureCache.releaseTexture(material._texturePaths[uniformId]);
                material._texturePaths[uniformId] = undefined;
                material._textures[uniformId] = uniformValue;
                return;
            }

            if (!defined(material._textures[uniformId])) {
                material._texturePaths[uniformId] = undefined;
                material._textures[uniformId] = context.defaultCubeMap;
            }

            if (uniformValue === Material.DefaultCubeMapId) {
                return;
            }

            var path =
                uniformValue.positiveX + uniformValue.negativeX +
                uniformValue.positiveY + uniformValue.negativeY +
                uniformValue.positiveZ + uniformValue.negativeZ;

            if (path !== material._texturePaths[uniformId]) {
                var newTexture = Material._textureCache.getTexture(path);
                if (defined(newTexture)) {
                    Material._textureCache.releaseTexture(material._texturePaths[uniformId]);
                    material._textures[uniformId] = newTexture;
                } else {
                    var promises = [
                        loadImage(uniformValue.positiveX),
                        loadImage(uniformValue.negativeX),
                        loadImage(uniformValue.positiveY),
                        loadImage(uniformValue.negativeY),
                        loadImage(uniformValue.positiveZ),
                        loadImage(uniformValue.negativeZ)
                    ];

                    when.all(promises).then(function(images) {
                        material._loadedCubeMaps.push({
                            id : uniformId,
                            images : images
                        });
                    });
                }

                material._texturePaths[uniformId] = path;
            }
        };
    }

    function createUniforms(material) {
        var uniforms = material._template.uniforms;
        for ( var uniformId in uniforms) {
            if (uniforms.hasOwnProperty(uniformId)) {
                createUniform(material, uniformId);
            }
        }
    }

    // Writes uniform declarations to the shader file and connects uniform values with
    // corresponding material properties through the returnUniforms function.
    function createUniform(material, uniformId) {
        var strict = material._strict;
        var materialUniforms = material._template.uniforms;
        var uniformValue = materialUniforms[uniformId];
        var uniformType = getUniformType(uniformValue);

        if (!defined(uniformType)) {
            throw new DeveloperError('fabric: uniform \'' + uniformId + '\' has invalid type.');
        } else if (uniformType === 'channels') {
            if (replaceToken(material, uniformId, uniformValue, false) === 0 && strict) {
                throw new DeveloperError('strict: shader source does not use channels \'' + uniformId + '\'.');
            }
        } else {
            // Since webgl doesn't allow texture dimension queries in glsl, create a uniform to do it.
            // Check if the shader source actually uses texture dimensions before creating the uniform.
            if (uniformType === 'sampler2D') {
                var imageDimensionsUniformName = uniformId + 'Dimensions';
                if (getNumberOfTokens(material, imageDimensionsUniformName) > 0) {
                    materialUniforms[imageDimensionsUniformName] = {
                        type : 'ivec3',
                        x : 1,
                        y : 1
                    };
                    createUniform(material, imageDimensionsUniformName);
                }
            }

            // Add uniform declaration to source code.
            var uniformDeclarationRegex = new RegExp('uniform\\s+' + uniformType + '\\s+' + uniformId + '\\s*;');
            if (!uniformDeclarationRegex.test(material.shaderSource)) {
                var uniformDeclaration = 'uniform ' + uniformType + ' ' + uniformId + ';';
                material.shaderSource = uniformDeclaration + material.shaderSource;
            }

            var newUniformId = uniformId + '_' + material._count++;
            if (replaceToken(material, uniformId, newUniformId) === 1 && strict) {
                throw new DeveloperError('strict: shader source does not use uniform \'' + uniformId + '\'.');
            }
            // Set uniform value
            material.uniforms[uniformId] = uniformValue;

            if (uniformType === 'sampler2D') {
                material._uniforms[newUniformId] = function() {
                    return material._textures[uniformId];
                };
                material._updateFunctions.push(createTexture2DUpdateFunction(uniformId));
            } else if (uniformType === 'samplerCube') {
                material._uniforms[newUniformId] = function() {
                    return material._textures[uniformId];
                };
                material._updateFunctions.push(createCubeMapUpdateFunction(uniformId));
            } else if (uniformType.indexOf('mat') !== -1) {
                var scratchMatrix = new matrixMap[uniformType]();
                material._uniforms[newUniformId] = function() {
                    return matrixMap[uniformType].fromColumnMajorArray(material.uniforms[uniformId], scratchMatrix);
                };
            } else {
                material._uniforms[newUniformId] = function() {
                    return material.uniforms[uniformId];
                };
            }
        }
    }

    // Determines the uniform type based on the uniform in the template.
    function getUniformType(uniformValue) {
        var uniformType = uniformValue.type;
        if (!defined(uniformType)) {
            var type = typeof uniformValue;
            if (type === 'number') {
                uniformType = 'float';
            } else if (type === 'boolean') {
                uniformType = 'bool';
            } else if (type === 'string') {
                if (/^([rgba]){1,4}$/i.test(uniformValue)) {
                    uniformType = 'channels';
                } else if (uniformValue === Material.DefaultCubeMapId) {
                    uniformType = 'samplerCube';
                } else {
                    uniformType = 'sampler2D';
                }
            } else if (type === 'object') {
                if (isArray(uniformValue)) {
                    if (uniformValue.length === 4 || uniformValue.length === 9 || uniformValue.length === 16) {
                        uniformType = 'mat' + Math.sqrt(uniformValue.length);
                    }
                } else {
                    var numAttributes = 0;
                    for ( var attribute in uniformValue) {
                        if (uniformValue.hasOwnProperty(attribute)) {
                            numAttributes += 1;
                        }
                    }
                    if (numAttributes >= 2 && numAttributes <= 4) {
                        uniformType = 'vec' + numAttributes;
                    } else if (numAttributes === 6) {
                        uniformType = 'samplerCube';
                    }
                }
            }
        }
        return uniformType;
    }

    // Create all sub-materials by combining source and uniforms together.
    function createSubMaterials(material) {
        var strict = material._strict;
        var subMaterialTemplates = material._template.materials;
        for ( var subMaterialId in subMaterialTemplates) {
            if (subMaterialTemplates.hasOwnProperty(subMaterialId)) {
                // Construct the sub-material.
                var subMaterial = new Material({
                    strict : strict,
                    fabric : subMaterialTemplates[subMaterialId],
                    count : material._count
                });

                material._count = subMaterial._count;
                material._uniforms = combine(material._uniforms, subMaterial._uniforms, true);
                material.materials[subMaterialId] = subMaterial;
                material._translucentFunctions = material._translucentFunctions.concat(subMaterial._translucentFunctions);

                // Make the material's czm_getMaterial unique by appending the sub-material type.
                var originalMethodName = 'czm_getMaterial';
                var newMethodName = originalMethodName + '_' + material._count++;
                replaceToken(subMaterial, originalMethodName, newMethodName);
                material.shaderSource = subMaterial.shaderSource + material.shaderSource;

                // Replace each material id with an czm_getMaterial method call.
                var materialMethodCall = newMethodName + '(materialInput)';
                if (replaceToken(material, subMaterialId, materialMethodCall) === 0 && strict) {
                    throw new DeveloperError('strict: shader source does not use material \'' + subMaterialId + '\'.');
                }
            }
        }
    }

    // Used for searching or replacing a token in a material's shader source with something else.
    // If excludePeriod is true, do not accept tokens that are preceded by periods.
    // http://stackoverflow.com/questions/641407/javascript-negative-lookbehind-equivalent
    function replaceToken(material, token, newToken, excludePeriod) {
        excludePeriod = defaultValue(excludePeriod, true);
        var count = 0;
        var suffixChars = '([\\w])?';
        var prefixChars = '([\\w' + (excludePeriod ? '.' : '') + '])?';
        var regExp = new RegExp(prefixChars + token + suffixChars, 'g');
        material.shaderSource = material.shaderSource.replace(regExp, function($0, $1, $2) {
            if ($1 || $2) {
                return $0;
            }
            count += 1;
            return newToken;
        });
        return count;
    }

    function getNumberOfTokens(material, token, excludePeriod) {
        return replaceToken(material, token, token, excludePeriod);
    }

    Material._textureCache = {
        _textures : {},

        addTexture : function(path, texture) {
            this._textures[path] = {
                texture : texture,
                count : 1
            };
        },

        getTexture : function(path) {
            var entry = this._textures[path];

            if (defined(entry)) {
                entry.count++;
                return entry.texture;
            }

            return undefined;
        },

        releaseTexture : function(path) {
            var entry = this._textures[path];
            if (defined(entry) && --entry.count === 0) {
                entry.texture = entry.texture && entry.texture.destroy();
                this._textures[path] = undefined;
            }
        }
    };

    Material._materialCache = {
        _materials : {},
        addMaterial : function(type, materialTemplate) {
            this._materials[type] = materialTemplate;
        },
        getMaterial : function(type) {
            return this._materials[type];
        }
    };

    /**
     * Gets or sets the default texture uniform value.
     * @type {String}
     */
    Material.DefaultImageId = 'czm_defaultImage';

    /**
     * Gets or sets the default cube map texture uniform value.
     * @type {String}
     */
    Material.DefaultCubeMapId = 'czm_defaultCubeMap';

    /**
     * Gets the name of the color material.
     * @type {String}
     * @readonly
     */
    Material.ColorType = 'Color';
    Material._materialCache.addMaterial(Material.ColorType, {
        fabric : {
            type : Material.ColorType,
            uniforms : {
                color : new Color(1.0, 0.0, 0.0, 0.5)
            },
            components : {
                diffuse : 'color.rgb',
                alpha : 'color.a'
            }
        },
        translucent : function(material) {
            return material.uniforms.color.alpha < 1.0;
        }
    });

    /**
     * Gets the name of the image material.
     * @type {String}
     * @readonly
     */
    Material.ImageType = 'Image';
    Material._materialCache.addMaterial(Material.ImageType, {
        fabric : {
            type : Material.ImageType,
            uniforms : {
                image : Material.DefaultImageId,
                repeat : new Cartesian2(1.0, 1.0)
            },
            components : {
                diffuse : 'texture2D(image, fract(repeat * materialInput.st)).rgb',
                alpha : 'texture2D(image, fract(repeat * materialInput.st)).a'
            }
        },
        translucent : true
    });

    /**
     * Gets the name of the diffuce map material.
     * @type {String}
     * @readonly
     */
    Material.DiffuseMapType = 'DiffuseMap';
    Material._materialCache.addMaterial(Material.DiffuseMapType, {
        fabric : {
            type : Material.DiffuseMapType,
            uniforms : {
                image : Material.DefaultImageId,
                channels : 'rgb',
                repeat : new Cartesian2(1.0, 1.0)
            },
            components : {
                diffuse : 'texture2D(image, fract(repeat * materialInput.st)).channels'
            }
        },
        translucent : false
    });

    /**
     * Gets the name of the alpha map material.
     * @type {String}
     * @readonly
     */
    Material.AlphaMapType = 'AlphaMap';
    Material._materialCache.addMaterial(Material.AlphaMapType, {
        fabric : {
            type : Material.AlphaMapType,
            uniforms : {
                image : Material.DefaultImageId,
                channel : 'a',
                repeat : new Cartesian2(1.0, 1.0)
            },
            components : {
                alpha : 'texture2D(image, fract(repeat * materialInput.st)).channel'
            }
        },
        translucent : true
    });

    /**
     * Gets the name of the specular map material.
     * @type {String}
     * @readonly
     */
    Material.SpecularMapType = 'SpecularMap';
    Material._materialCache.addMaterial(Material.SpecularMapType, {
        fabric : {
            type : Material.SpecularMapType,
            uniforms : {
                image : Material.DefaultImageId,
                channel : 'r',
                repeat : new Cartesian2(1.0, 1.0)
            },
            components : {
                specular : 'texture2D(image, fract(repeat * materialInput.st)).channel'
            }
        },
        translucent : false
    });

    /**
     * Gets the name of the emmision map material.
     * @type {String}
     * @readonly
     */
    Material.EmissionMapType = 'EmissionMap';
    Material._materialCache.addMaterial(Material.EmissionMapType, {
        fabric : {
            type : Material.EmissionMapType,
            uniforms : {
                image : Material.DefaultImageId,
                channels : 'rgb',
                repeat : new Cartesian2(1.0, 1.0)
            },
            components : {
                emission : 'texture2D(image, fract(repeat * materialInput.st)).channels'
            }
        },
        translucent : false
    });

    /**
     * Gets the name of the bump map material.
     * @type {String}
     * @readonly
     */
    Material.BumpMapType = 'BumpMap';
    Material._materialCache.addMaterial(Material.BumpMapType, {
        fabric : {
            type : Material.BumpMapType,
            uniforms : {
                image : Material.DefaultImageId,
                channel : 'r',
                strength : 0.8,
                repeat : new Cartesian2(1.0, 1.0)
            },
            source : BumpMapMaterial
        },
        translucent : false
    });

    /**
     * Gets the name of the normal map material.
     * @type {String}
     * @readonly
     */
    Material.NormalMapType = 'NormalMap';
    Material._materialCache.addMaterial(Material.NormalMapType, {
        fabric : {
            type : Material.NormalMapType,
            uniforms : {
                image : Material.DefaultImageId,
                channels : 'rgb',
                strength : 0.8,
                repeat : new Cartesian2(1.0, 1.0)
            },
            source : NormalMapMaterial
        },
        translucent : false
    });

    /**
     * Gets the name of the grid material.
     * @type {String}
     * @readonly
     */
    Material.GridType = 'Grid';
    Material._materialCache.addMaterial(Material.GridType, {
        fabric : {
            type : Material.GridType,
            uniforms : {
                color : new Color(0.0, 1.0, 0.0, 1.0),
                cellAlpha : 0.1,
                lineCount : new Cartesian2(8.0, 8.0),
                lineThickness : new Cartesian2(1.0, 1.0),
                lineOffset : new Cartesian2(0.0, 0.0)
            },
            source : GridMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.color.alpha < 1.0) || (uniforms.cellAlpha < 1.0);
        }
    });

    /**
     * Gets the name of the stripe material.
     * @type {String}
     * @readonly
     */
    Material.StripeType = 'Stripe';
    Material._materialCache.addMaterial(Material.StripeType, {
        fabric : {
            type : Material.StripeType,
            uniforms : {
                horizontal : true,
                evenColor : new Color(1.0, 1.0, 1.0, 0.5),
                oddColor : new Color(0.0, 0.0, 1.0, 0.5),
                offset : 0.0,
                repeat : 5.0
            },
            source : StripeMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.evenColor.alpha < 1.0) || (uniforms.oddColor.alpha < 0.0);
        }
    });

    /**
     * Gets the name of the checkerboard material.
     * @type {String}
     * @readonly
     */
    Material.CheckerboardType = 'Checkerboard';
    Material._materialCache.addMaterial(Material.CheckerboardType, {
        fabric : {
            type : Material.CheckerboardType,
            uniforms : {
                lightColor : new Color(1.0, 1.0, 1.0, 0.5),
                darkColor : new Color(0.0, 0.0, 0.0, 0.5),
                repeat : new Cartesian2(5.0, 5.0)
            },
            source : CheckerboardMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
        }
    });

    /**
     * Gets the name of the dot material.
     * @type {String}
     * @readonly
     */
    Material.DotType = 'Dot';
    Material._materialCache.addMaterial(Material.DotType, {
        fabric : {
            type : Material.DotType,
            uniforms : {
                lightColor : new Color(1.0, 1.0, 0.0, 0.75),
                darkColor : new Color(0.0, 1.0, 1.0, 0.75),
                repeat : new Cartesian2(5.0, 5.0)
            },
            source : DotMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.lightColor.alpha < 1.0) || (uniforms.darkColor.alpha < 0.0);
        }
    });

    /**
     * Gets the name of the water material.
     * @type {String}
     * @readonly
     */
    Material.WaterType = 'Water';
    Material._materialCache.addMaterial(Material.WaterType, {
        fabric : {
            type : Material.WaterType,
            uniforms : {
                baseWaterColor : new Color(0.2, 0.3, 0.6, 1.0),
                blendColor : new Color(0.0, 1.0, 0.699, 1.0),
                specularMap : Material.DefaultImageId,
                normalMap : Material.DefaultImageId,
                frequency : 10.0,
                animationSpeed : 0.01,
                amplitude : 1.0,
                specularIntensity : 0.5,
                fadeFactor : 1.0
            },
            source : WaterMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.baseWaterColor.alpha < 1.0) || (uniforms.blendColor.alpha < 0.0);
        }
    });

    /**
     * Gets the name of the rim lighting material.
     * @type {String}
     * @readonly
     */
    Material.RimLightingType = 'RimLighting';
    Material._materialCache.addMaterial(Material.RimLightingType, {
        fabric : {
            type : Material.RimLightingType,
            uniforms : {
                color : new Color(1.0, 0.0, 0.0, 0.7),
                rimColor : new Color(1.0, 1.0, 1.0, 0.4),
                width : 0.3
            },
            source : RimLightingMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.color.alpha < 1.0) || (uniforms.rimColor.alpha < 0.0);
        }
    });

    /**
     * Gets the name of the fade material.
     * @type {String}
     * @readonly
     */
    Material.FadeType = 'Fade';
    Material._materialCache.addMaterial(Material.FadeType, {
        fabric : {
            type : Material.FadeType,
            uniforms : {
                fadeInColor : new Color(1.0, 0.0, 0.0, 1.0),
                fadeOutColor : new Color(0.0, 0.0, 0.0, 0.0),
                maximumDistance : 0.5,
                repeat : true,
                fadeDirection : {
                    x : true,
                    y : true
                },
                time : new Cartesian2(0.5, 0.5)
            },
            source : FadeMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.fadeInColor.alpha < 1.0) || (uniforms.fadeOutColor.alpha < 0.0);
        }
    });

    /**
     * Gets the name of the polyline arrow material.
     * @type {String}
     * @readonly
     */
    Material.PolylineArrowType = 'PolylineArrow';
    Material._materialCache.addMaterial(Material.PolylineArrowType, {
        fabric : {
            type : Material.PolylineArrowType,
            uniforms : {
                color : new Color(1.0, 1.0, 1.0, 1.0)
            },
            source : PolylineArrowMaterial
        },
        translucent : true
    });

    /**
     * Gets the name of the polyline glow material.
     * @type {String}
     * @readonly
     */
    Material.PolylineGlowType = 'PolylineGlow';
    Material._materialCache.addMaterial(Material.PolylineGlowType, {
        fabric : {
            type : Material.PolylineGlowType,
            uniforms : {
                color : new Color(0.0, 0.5, 1.0, 1.0),
                glowPower : 0.25
            },
            source : PolylineGlowMaterial
        },
        translucent : true
    });

    /**
     * Gets the name of the polyline outline material.
     * @type {String}
     * @readonly
     */
    Material.PolylineOutlineType = 'PolylineOutline';
    Material._materialCache.addMaterial(Material.PolylineOutlineType, {
        fabric : {
            type : Material.PolylineOutlineType,
            uniforms : {
                color : new Color(1.0, 1.0, 1.0, 1.0),
                outlineColor : new Color(1.0, 0.0, 0.0, 1.0),
                outlineWidth : 1.0
            },
            source : PolylineOutlineMaterial
        },
        translucent : function(material) {
            var uniforms = material.uniforms;
            return (uniforms.color.alpha < 1.0) || (uniforms.outlineColor.alpha < 1.0);
        }
    });

    return Material;
});