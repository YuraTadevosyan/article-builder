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
    cy.get('[data-testid="dashboard"]').should('be.visible')
    cy.contains('All articles').should('be.visible')
    cy.contains('No articles yet').should('be.visible')
  })

  it('navigates to history', () => {
    cy.get('[data-testid="nav-history"]').click()
    cy.get('[data-testid="history-page"]').should('be.visible')
    cy.contains('Version history').should('be.visible')
  })

  it('navigates to settings', () => {
    cy.get('[data-testid="nav-settings"]').click()
    cy.get('[data-testid="settings-page"]').should('be.visible')
    cy.contains('Settings').should('be.visible')
  })

  it('opens a newly created article in the editor', () => {
    cy.get('[data-testid="new-article-btn"]').first().click()
    cy.get('[data-testid="edit-pane"]').should('be.visible')
    cy.get('[data-testid="article-title-input"]').should('have.value', 'Untitled draft')
  })

  it('returns to the editor by clicking the article in the sidebar', () => {
    cy.get('[data-testid="new-article-btn"]').first().click()
    cy.get('[data-testid="nav-dashboard"]').click()
    cy.get('[data-testid^="article-item-"]').first().click()
    cy.get('[data-testid="edit-pane"]').should('be.visible')
    cy.get('[data-testid="article-title-input"]').should('have.value', 'Untitled draft')
  })
})
