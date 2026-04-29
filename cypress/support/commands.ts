// Custom Cypress commands

Cypress.Commands.add('openCommandPalette', () => {
  cy.get('body').type('{meta}k')
})

declare global {
  namespace Cypress {
    interface Chainable {
      openCommandPalette(): Chainable<void>
    }
  }
}

export {}
