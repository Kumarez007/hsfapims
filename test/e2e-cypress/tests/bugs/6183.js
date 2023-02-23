describe("When trying it out", () => {
  it("should render the response headers as comma separated lists", () => {
    cy.intercept({
      method: "GET",
      url: "/response-headers",
      hostname: "httpbin.org",
    }, {})

    cy.visit("/?url=/documents/bugs/6183.yaml")
      .get("#operations-default-get_response_headers")
      .click()
      .get(".try-out__btn")
      .click()
      .get(".btn.execute")
      .click()
      .wait(1000)
      .get(".response-col_description .microlight")
      .find(("span:contains(\"value1,value2\")"))
      .should("exist")
      .get(".response-col_description .microlight")
      .find(("span:contains(\"value3,value4\")"))
      .should("exist")
      .get(".response-col_description .microlight")
      .find(("span:contains(\"value5,value6\")"))
      .should("exist")
  })
})
