import expect, { createSpy, spyOn } from "expect"
import { fromJS, Map } from "immutable"
import {
  authorizeRequest,
  authorizeAccessCodeWithFormParams,  
  wrappedAuthorize,
  wrappedAuthorizeOauth2,
  wrappedLogout,
  persistAuthorizationIfNeeded
} from "corePlugins/auth/actions"

describe("auth plugin - actions", () => {

  describe("authorizeRequest", () => {

    [
      [
        {
          oas3: true,
          server: "https://host/resource",
          effectiveServer: "https://host/resource",
          scheme: "http",
          host: null,
          url: "http://specs/file",
        },
        "https://host/authorize"
      ],
      [
        {
          oas3: true,
          server: "https://{selected_host}/resource",
          effectiveServer: "https://host/resource",
          scheme: "http",
          host: null,
          url: "http://specs/file",
        },
        "https://host/authorize"
      ],
      [
        {
          oas3: false,
          server: null,
          effectiveServer: null,
          scheme: "https",
          host: undefined,
          url: "https://specs/file",
        },
        "https://specs/authorize"
      ],
      [
        {
          oas3: false,
          server: null,
          effectiveServer: null,
          scheme: "https",
          host: "host",
          url: "http://specs/file",
        },
        "http://specs/authorize"
      ],
    ].forEach(([{oas3, server, effectiveServer, scheme, host, url}, expectedFetchUrl]) => {
      it("should resolve authorization endpoint against the server URL", () => {

        // Given
        const data = {
          url: "/authorize"
        }
        const system = {
          fn: {
            fetch: jest.fn().mockImplementation(() => Promise.resolve())
          },
          getConfigs: () => ({}),
          authSelectors: {
            getConfigs: () => ({})
          },
          oas3Selectors: {
            selectedServer: () => server,
            serverEffectiveValue: () => effectiveServer || server
          },
          specSelectors: {
            isOAS3: () => oas3,
            operationScheme: () => scheme,
            host: () => host,
            url: () => url
          }
        }

        // When
        authorizeRequest(data)(system)

        // Then
        expect(system.fn.fetch.mock.calls.length).toEqual(1)
        expect(system.fn.fetch.mock.calls[0][0]).toEqual(expect.objectContaining({url: expectedFetchUrl}))
      })
    })

    it("should add additionalQueryStringParams to Swagger 2.0 authorization and token URLs", () => {

      // Given
      const data = {
        url: "/authorize?q=1"
      }
      const system = {
        fn: {
          fetch: jest.fn().mockImplementation(() => Promise.resolve())
        },
        getConfigs: () => ({}),
        authSelectors: {
          getConfigs: () => ({
            additionalQueryStringParams: {
              myCustomParam: "abc123"
            }
          })
        },
        specSelectors: {
          isOAS3: () => false,
          operationScheme: () => "https",
          host: () => "http://google.com",
          url: () => "http://google.com/swagger.json"
        }
      }

      // When
      authorizeRequest(data)(system)

      // Then
      expect(system.fn.fetch.mock.calls.length).toEqual(1)

      expect(system.fn.fetch.mock.calls[0][0].url)
        .toEqual("http://google.com/authorize?q=1&myCustomParam=abc123")
    })

    it("should add additionalQueryStringParams to OpenAPI 3.0 authorization and token URLs", () => {

      // Given
      const data = {
        url: "/authorize?q=1"
      }
      const system = {
        fn: {
          fetch: jest.fn().mockImplementation(() => Promise.resolve())
        },
        getConfigs: () => ({}),
        authSelectors: {
          getConfigs: () => ({
            additionalQueryStringParams: {
              myCustomParam: "abc123"
            }
          })
        },
        oas3Selectors: {
          selectedServer: () => "http://google.com",
          serverEffectiveValue: () => "http://google.com"
        },
        specSelectors: {
          isOAS3: () => true,
        }
      }

      // When
      authorizeRequest(data)(system)

      // Then
      expect(system.fn.fetch.mock.calls.length).toEqual(1)

      expect(system.fn.fetch.mock.calls[0][0].url)
        .toEqual("http://google.com/authorize?q=1&myCustomParam=abc123")
    })
  })

  describe("tokenRequest", function() {
    it("should send the code verifier when set", () => {
      const data = {
        auth: {
          schema: {
            get: () => "http://tokenUrl"
          },
          codeVerifier: "mock_code_verifier"
        },
        redirectUrl: "http://google.com"
      }

      const authActions = {
        authorizeRequest: jest.fn()
      }

      authorizeAccessCodeWithFormParams(data)({ authActions })

      expect(authActions.authorizeRequest.mock.calls.length).toEqual(1)
      const actualArgument = authActions.authorizeRequest.mock.calls[0][0]
      expect(actualArgument.body).toContain("code_verifier=" + data.auth.codeVerifier)
      expect(actualArgument.body).toContain("grant_type=authorization_code")
    })
  })

  describe("persistAuthorization", () => {
    describe("wrapped functions", () => {
      it("should wrap `authorize` action and persist data if needed", () => {

        // Given
        const data = {
          "api_key": {}
        }
        const system = {          
          getConfigs: () => ({}),
          authActions: {
            authorize: createSpy(),
            persistAuthorizationIfNeeded: createSpy()
          }
        }
  
        // When
        wrappedAuthorize(data)(system)
  
        // Then
        expect(system.authActions.authorize.calls.length).toEqual(1)  
        expect(system.authActions.authorize.calls[0].arguments[0]).toMatch(data)
        expect(system.authActions.persistAuthorizationIfNeeded.calls.length).toEqual(1)
      })

      it("should wrap `oauth2Authorize` action and persist data if needed", () => {

        // Given
        const data = {
          "api_key": {}
        }
        const system = {          
          getConfigs: () => ({}),
          authActions: {
            authorizeOauth2: createSpy(),
            persistAuthorizationIfNeeded: createSpy()
          }
        }
  
        // When
        wrappedAuthorizeOauth2(data)(system)
  
        // Then
        expect(system.authActions.authorizeOauth2.calls.length).toEqual(1)  
        expect(system.authActions.authorizeOauth2.calls[0].arguments[0]).toMatch(data)
        expect(system.authActions.persistAuthorizationIfNeeded.calls.length).toEqual(1)
      })

      it("should wrap `logout` action and persist data if needed", () => {

        // Given
        const data = {
          "api_key": {}
        }
        const system = {          
          getConfigs: () => ({}),
          authActions: {
            logout: createSpy(),
            persistAuthorizationIfNeeded: createSpy()
          }
        }
  
        // When
        wrappedLogout(data)(system)
  
        // Then
        expect(system.authActions.logout.calls.length).toEqual(1)  
        expect(system.authActions.logout.calls[0].arguments[0]).toMatch(data)
        expect(system.authActions.persistAuthorizationIfNeeded.calls.length).toEqual(1)
      })
    })    

    describe("persistAuthorizationIfNeeded", () => {
      beforeEach(() => {
        localStorage.clear()
      })
      it("should skip if `persistAuthorization` is turned off", () => {
        // Given        
        const system = {          
          getConfigs: () => ({
            persistAuthorization: false
          }),          
          authSelectors: {
            authorized: createSpy()
          }
        }
  
        // When
        persistAuthorizationIfNeeded()(system)
  
        // Then
        expect(system.authSelectors.authorized.calls.length).toEqual(0)          
      })
      it("should persist authorization data to localStorage", () => {
        // Given
        const data = {
          "api_key": {}
        }
        const system = {          
          getConfigs: () => ({
            persistAuthorization: true
          }),          
          authSelectors: {
            authorized: createSpy().andReturn(
              Map(data)
            )
          }
        }
        const localStorageSetSpy = spyOn(localStorage, "setItem")      

        // When
        persistAuthorizationIfNeeded()(system)

        expect(localStorageSetSpy.calls.length).toEqual(1)
        expect(localStorageSetSpy.calls[0].arguments[0]).toEqual("authorized")
        expect(localStorageSetSpy.calls[0].arguments[1]).toEqual(JSON.stringify(data))
  
      })
    })

  })
})
