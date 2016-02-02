class Expansions extends Choices

  initialize: ->
    #extra attributes: queryParamString, currentExpansions, allchoices, expandedFields, unexpandedFields, isExpansions
    @set("isExpansions", true)
    @parseChoices()
    @set("queryParamString", "")
    @update()

  parseChoices: ->
    #Based on current practice of having all choices in a string representation of an array in the description
    choicesString = @get("description")
    choiceArray = choicesString.slice(choicesString.indexOf("[") + 1, choicesString.indexOf("]")).split(/[\s,]+/)
    currentExpansions = {}
    for field in choiceArray
      currentExpansions[field] = false

    @set("currentExpansions", currentExpansions)
    @set("allChoices", choiceArray)

  setExpansion: (field, expanded) ->
    @get("currentExpansions")[field] = expanded
    @update()

  expansionFromJSON: (field) ->
    unless @get("currentExpansions")[field]
      @get("currentExpansions")[field] = true
      @update()
      @trigger("expansionFromJSON", field)

  update: ->
    currentExpansions = @get("currentExpansions")
    queryParamString = ""
    expandedFields = []
    unexpandedFields = []
    for own field of currentExpansions
      if currentExpansions[field]
        expandedFields.push(field)
        queryParamString = queryParamString.concat(field, ",")
      else
        unexpandedFields.push(field)

    @set("queryParamString", queryParamString.slice(0, -1))
    @set("expandedFields", expandedFields)
    @set("unexpandedFields", unexpandedFields)