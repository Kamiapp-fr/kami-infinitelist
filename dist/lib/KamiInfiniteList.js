"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//polyfill
require("@webcomponents/webcomponentsjs/custom-elements-es5-adapter");
require("@webcomponents/webcomponentsjs/webcomponents-bundle");
require("web-animations-js");
var kami_component_1 = require("kami-component");
var axios_1 = require("axios");
var KamiInfiniteList = /** @class */ (function (_super) {
    __extends(KamiInfiniteList, _super);
    function KamiInfiniteList() {
        var _this = _super.call(this) || this;
        /**
         * @property {Array<Object>} - store all the component get form the datasource
         */
        _this.components = [];
        /**
         * is true if the list is in loading
         * @property {Boolean} - loading stat
         */
        _this.inLoad = false;
        /**
         * This property is at true if the datasource is at the end
         * @property {Boolean} - stat of the datasource
         */
        _this.end = false;
        _this.componentAttributes = [];
        return _this;
    }
    Object.defineProperty(KamiInfiniteList, "observedAttributes", {
        get: function () {
            return [
                'datasource',
                'delegate',
                'width',
                'height',
                'useSearch',
                'searchQuery',
                'sortQuery',
                'page',
                'limit'
            ];
        },
        enumerable: true,
        configurable: true
    });
    KamiInfiniteList.prototype.setProperties = function () {
        this.props = this.observe({
            datasource: this.getAttribute('datasource'),
            delegate: this.getAttribute('delegate'),
            width: this.getAttribute('width') || '100%',
            height: this.getAttribute('height') || '100vh',
            useSearch: this.toBoolean(this.getAttribute('useSearch')) || false,
            searchQuery: this.getAttribute('searchQuery') || 'search',
            sortQuery: this.getAttribute('sortQuery') || 'sort',
            page: this.getAttribute('page') || '1',
            query: {
                page: this.getAttribute('page') || '1',
                limit: this.getAttribute('limit') || '10'
            },
        });
        if (this.props.useSearch) {
            //update the query with url query
            this.props.query[this.props.searchQuery] = this.getUrlParam(this.props.searchQuery);
            this.props.query[this.props.sortQuery] = this.getUrlParam(this.props.sortQuery);
        }
    };
    KamiInfiniteList.prototype.initEventListener = function () {
        //add your listnener here 
    };
    KamiInfiniteList.prototype.connectedCallback = function () {
        var _this = this;
        //init dom.
        this.container = this.wrapper.querySelector('.infiniteliste');
        //clone the delegate element from the root element.
        this.component = this.querySelector(this.props.delegate).cloneNode();
        //get all attribute from the delegate element.
        this.componentAttributes = this.getAttributes(this.component);
        //get the data from the data source
        this.getData();
        //init scroll listener
        this.container.addEventListener('scroll', function () {
            if (Math.round(_this.container.scrollTop + 20) > (_this.container.scrollHeight - _this.container.offsetHeight)) {
                if (!_this.inLoad && !_this.end) {
                    //increment the page
                    _this.props.query.page++;
                    //set the state inLoad at true
                    _this.inLoad = true;
                    //get the new data
                    _this.getData();
                }
            }
        });
        //add event listener on the searchbar
        //only if the useSearch property is set at true
        if (this.props.useSearch) {
            //event listener for the sort event
            this.wrapper.querySelector('searchbar-element').addEventListener('sort', function (event) {
                //update the query
                _this.props.query[_this.props.sortQuery] = event.detail.isAscending;
                //update the data
                _this.updateData(_this.props.sortQuery, event.detail.isAscending);
            });
            //event listener for the search event
            this.wrapper.querySelector('searchbar-element').addEventListener('search', function (event) {
                //update the query
                _this.props.query[_this.props.searchQuery] = event.detail.search;
                //update the data
                _this.updateData(_this.props.searchQuery, event.detail.search);
            });
        }
    };
    /**
     * This methode get the data from the datasource.
     * After it will create all the dom and append this into the infinite list.
     * @returns {InfiniteList} this
     */
    KamiInfiniteList.prototype.getData = function () {
        var _this = this;
        //set the inLoad state a true
        this.inLoad = true;
        //get the data from the endpoint
        axios_1.default.get(this.props.datasource, { params: this.props.query }).then(function (res) {
            //check if data are array else throw an error
            if (Array.isArray(res.data)) {
                //if the data length are not the same as the limit property
                //the end state is set at true and stop the get data methode
                if (res.data.length != _this.props.query.limit) {
                    _this.end = true;
                }
                var _loop_1 = function () {
                    var data = res.data[_this.data];
                    if (data instanceof Object && !Array.isArray(data)) {
                        var component_1 = _this.component.cloneNode();
                        _this.componentAttributes.forEach(function (atts) {
                            var dataProvide = _this.convertData(data, component_1.getAttribute(atts.toString()));
                            atts != 'slots' ?
                                component_1.setAttribute(atts, dataProvide) :
                                component_1.innerHTML = dataProvide;
                        });
                        _this.components.push(component_1);
                        _this.addComponent(component_1);
                    }
                    else {
                        throw new Error('Data should be an array of object !');
                    }
                };
                //for each data it will convert and create a component
                //all component are set into the components property
                //and the create dom are append to the main dom
                for (_this.data in res.data) {
                    _loop_1();
                }
            }
            else {
                throw new Error('Data should be an array of object !');
            }
            //at the end the inload state is set as false 
            _this.inLoad = false;
        }).catch(function (error) {
            //error handling
            console.log(error.message);
        });
        return this;
    };
    /**
     * Update the url query and reload all the data.
     * @param {Object} object
     * @param {String} object.param - param for the url
     * @param {String} object.value - the value of the param
     * @returns {InfiniteList} this
     */
    KamiInfiniteList.prototype.updateData = function (param, value) {
        this
            //update the url browser
            .setUrlParam(param, value)
            //reset the list
            .resetList()
            //add the new data with the new query
            .getData();
        return this;
    };
    /**
     * Reset all the property of list to reload new data.
     * @returns {InfiniteList} this
     */
    KamiInfiniteList.prototype.resetList = function () {
        //remove all component store
        this.components = [];
        //remove all component from the ui
        this.container.innerHTML = '';
        //reset the page number
        this.props.query.page = this.props.page;
        //reset the end property
        this.end = false;
        return this;
    };
    /**
     * Convert your data
     * @param {Object} obj - Object to convert
     * @param {String} path - path
     * @param {String} separator
     */
    KamiInfiniteList.prototype.convertData = function (obj, path, separator) {
        if (obj === void 0) { obj = self; }
        if (separator === void 0) { separator = '.'; }
        var properties = Array.isArray(path) ? path : path.split(separator);
        return properties.reduce(function (prev, curr) { return prev && prev[curr]; }, obj);
    };
    /**
     * Add a new component into the main container
     * @param {HTMLElement} component - add
     */
    KamiInfiniteList.prototype.addComponent = function (component) {
        this.container.append(component);
    };
    /**
     * Get all attribute for a dom
     * @param {HTMLElement} el - an html element this attr
     * @returns {Array.<String>} - all attribute in a array
     */
    KamiInfiniteList.prototype.getAttributes = function (el) {
        for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++) {
            arr.push(atts[i].nodeName);
        }
        return arr;
    };
    KamiInfiniteList.prototype.renderSearch = function () {
        return "\n            <searchbar-element \n                searchprops=\"" + (this.getUrlParam(this.props.searchQuery) || '') + "\"\n                ascendingprops=\"" + (this.getUrlParam(this.props.sortQuery) || false) + "\"\n            >\n            </searchbar-element>\n        ";
    };
    KamiInfiniteList.prototype.renderHtml = function () {
        return "\n            " + (this.props.useSearch ? this.renderSearch() : '') + "\n            <div class=\"infiniteliste\"></div>\n        ";
    };
    KamiInfiniteList.prototype.renderStyle = function () {
        return "\n            @import '/css/icon.css';\n\n            .infiniteliste{\n                width: " + this.props.width + ";\n                height : " + this.props.height + ";\n                overflow-y: scroll;\n            }\n        ";
    };
    return KamiInfiniteList;
}(kami_component_1.default));
exports.default = KamiInfiniteList;
//# sourceMappingURL=KamiInfiniteList.js.map