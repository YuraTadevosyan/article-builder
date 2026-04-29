describe('Dashboard', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('[data-testid="nav-dashboard"]').click()
  })

  it('shows the empty state when there are no articles', () => {
    cy.get('[data-testid="dashboard"]').should('be.visible')
    cy.contains('No articles yet').should('be.visible')
    cy.get('[data-testid^="article-card-"]').should('not.exist')
  })

  it('shows stats strip', () => {
    cy.contains('Total').should('be.visible')
    cy.contains('Drafts').should('be.visible')
    cy.contains('Published').should('be.visible')
    cy.contains('Words written').should('be.visible')
  })

  it('creates a new article from the dashboard', () => {
    cy.get('[data-testid="new-article-btn"]').first().click()
    cy.get('[data-testid="edit-pane"]').should('be.visible')
    cy.get('[data-testid="article-title-input"]').should('have.value', 'Untitled draft')
  })

  context('with one or more articles', () => {
    beforeEach(() => {
      // Seed via the UI: create two articles.
      cy.get('[data-testid="new-article-btn"]').first().click()
      cy.get('[data-testid="article-title-input"]').clear().type('Boring stacks ship')
      cy.get('[data-testid="nav-dashboard"]').click()
      cy.get('[data-testid="new-article-btn"]').first().click()
      cy.get('[data-testid="article-title-input"]').clear().type('On reading slower')
      cy.get('[data-testid="nav-dashboard"]').click()
    })

    it('lists created articles as cards', () => {
      cy.get('[data-testid^="article-card-"]').should('have.length', 2)
    })

    it('searches articles by title', () => {
      cy.get('[data-testid="search-input"]').type('boring')
      cy.get('[data-testid^="article-card-"]').should('have.length', 1)
      cy.contains('Boring stacks ship').should('be.visible')
    })

    it('clears search to show all articles', () => {
      cy.get('[data-testid="search-input"]').type('boring')
      cy.get('[data-testid="search-input"]').clear()
      cy.get('[data-testid^="article-card-"]').should('have.length', 2)
    })

    it('switches to list view', () => {
      cy.get('[data-testid="view-list"]').click()
      cy.get('[data-testid^="article-list-item-"]').should('have.length', 2)
      cy.get('[data-testid^="article-card-"]').should('not.exist')
    })

    it('opens an article in the editor on card click', () => {
      cy.contains('Boring stacks ship').click()
      cy.get('[data-testid="edit-pane"]').should('be.visible')
      cy.get('[data-testid="article-title-input"]').should('have.value', 'Boring stacks ship')
    })

    it('deletes an article via the card menu', () => {
      cy.get('[data-testid^="article-card-menu-"]').first().click()
      cy.contains('Delete').click()
      cy.get('[data-testid^="article-card-"]').should('have.length', 1)
    })
  })
})
