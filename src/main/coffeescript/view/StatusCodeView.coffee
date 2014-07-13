class StatusCodeView extends Backbone.View
  initialize: ->

  isListType: (type) ->
    listType = null
    if type && type.indexOf('[') >= 0
      listType = type.substring(type.indexOf('[') + 1, type.indexOf(']'))
    else
      listType = undefined
    listType

  render: ->
    template = @template()
    $(@el).html(template(@model))
    listType = @isListType(@model.responseModel)
    if swaggerUi.api.models.hasOwnProperty(listType || @model.responseModel)
      isPrimitive = false
      if (listType != null && swaggerUi.api.models[listType]) || swaggerUi.api.models[@model.responseModel] != null
        isPrimitive = false
      else
        isPrimitive = true
      jsonSample = null;
      mockSignature = null;
      if isPrimitive
        jsonSample = undefined
        mockSignature = undefined
      else if listType
        jsonSample = '[' + JSON.stringify(swaggerUi.api.models[listType].createJSONSample(), null, 2) + ']'
        mockSignature = '<span class="strong">Array of </span>' + swaggerUi.api.models[listType].getMockSignature()
      else
        jsonSample = JSON.stringify(swaggerUi.api.models[@model.responseModel].createJSONSample(), null, 2)
        mockSignature = swaggerUi.api.models[@model.responseModel].getMockSignature()
      responseModel =
        sampleJSON: jsonSample
        isParam: false
        signature: mockSignature

      responseModelView = new SignatureView({model: responseModel, tagName: 'div'})
      $('.model-signature', @$el).append responseModelView.render().el
    else
      $('.model-signature', @$el).html ''
    @

  template: ->
    Handlebars.templates.status_code

