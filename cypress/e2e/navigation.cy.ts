describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('shows the sidebar with brand and nav items', () => {
    cy.get('[data-testid="sidebar"]').should('be.visible')
    cy.contains('Article Builder').should('be.visible')
    cy.get('[data-testid="nav-editor"]').should('be.visible')
    cy.get('[data-testid="nav-dashboard"]').should('be.visible')
    cy.get('[data-testid="nav-history"]').should('be.visible')
    cy.get('[data-testid="nav-settings"]').should('be.visible')
  })

  it('lands on the dashboard with the empty state', () => {
    cy.location('pathname').should('match', /\/dashboard$/)
    cy.get('[data-testid="dashboard"]').should('be.visible')
    cy.contains('All articles').should('be.visible')
    cy.contains('No articles yet').should('be.visible')
  })

  it('navigates to history (URL changes)', () => {
    cy.get('[data-testid="nav-history"]').click()
    cy.location('pathname').should('match', /\/history$/)
    cy.get('[data-testid="history-page"]').should('be.visible')
    cy.contains('Version history').should('be.visible')
  })

  it('navigates to settings (URL changes)', () => {
    cy.get('[data-testid="nav-settings"]').click()
    cy.location('pathname').should('match', /\/settings$/)
    cy.get('[data-testid="settings-page"]').should('be.visible')
    cy.contains('Settings').should('be.visible')
  })

  it('opens a newly created article in the editor at /editor/:id', () => {
    cy.get('[data-testid="new-article-btn"]').first().click()
    cy.location('pathname').should('match', /\/editor\/art-/)
    cy.get('[data-testid="edit-pane"]').should('be.visible')
    cy.get('[data-testid="article-title-input"]').should('have.value', 'Untitled draft')
  })

  it('clicking an article in the sidebar deep-links to its editor route', () => {
    cy.get('[data-testid="new-article-btn"]').first().click()
    cy.get('[data-testid="nav-dashboard"]').click()
    cy.get('[data-testid^="article-item-"]').first().click()
    cy.location('pathname').should('match', /\/editor\/art-/)
    cy.get('[data-testid="article-title-input"]').should('have.value', 'Untitled draft')
  })

  it('unknown routes redirect to /dashboard', () => {
    cy.visit('/this-route-does-not-exist', { failOnStatusCode: false })
    cy.location('pathname').should('match', /\/dashboard$/)
  })
})
