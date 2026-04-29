describe('Editor', () => {
  beforeEach(() => {
    cy.visit('/')
    // Empty initial state — create a draft to enter the editor.
    cy.get('[data-testid="new-article-btn"]').first().click()
  })

  it('loads the editor with the new article', () => {
    cy.get('[data-testid="edit-pane"]').should('be.visible')
    cy.get('[data-testid="article-title-input"]').should('have.value', 'Untitled draft')
  })

  it('shows the editor toolbar', () => {
    cy.get('[data-testid="editor-toolbar"]').should('be.visible')
    cy.contains('Format').should('be.visible')
  })

  it('shows the preview pane in split mode by default', () => {
    cy.get('[data-testid="preview-pane"]').should('be.visible')
    cy.contains('Live preview').should('be.visible')
  })

  it('switches to edit-only view', () => {
    cy.get('[data-testid="view-edit"]').click()
    cy.get('[data-testid="edit-pane"]').should('be.visible')
    cy.get('[data-testid="preview-pane"]').should('not.exist')
  })

  it('switches to preview-only view', () => {
    cy.get('[data-testid="view-preview"]').click()
    cy.get('[data-testid="preview-pane"]').should('be.visible')
    cy.get('[data-testid="edit-pane"]').should('not.exist')
  })

  it('updates article title in real time', () => {
    cy.get('[data-testid="article-title-input"]').clear().type('My Updated Title')
    cy.get('[data-testid="article-title-input"]').should('have.value', 'My Updated Title')
  })

  it('shows add block button', () => {
    cy.get('[data-testid="add-block-btn"]').should('be.visible')
  })

  it('opens metadata modal', () => {
    cy.get('[data-testid="metadata-btn"]').click()
    cy.get('[data-testid="modal"]').should('be.visible')
    cy.contains('Article metadata').should('be.visible')
  })

  it('opens export modal', () => {
    cy.get('[data-testid="export-btn"]').click()
    cy.get('[data-testid="modal"]').should('be.visible')
    cy.contains('Export article').should('be.visible')
  })

  it('toggles AI panel', () => {
    cy.get('[data-testid="ai-toggle-btn"]').click()
    cy.get('[data-testid="ai-panel"]').should('be.visible')
    cy.get('[data-testid="ai-toggle-btn"]').click()
    cy.get('[data-testid="ai-panel"]').should('not.exist')
  })

  it('publishes article and shows toast', () => {
    cy.get('[data-testid="publish-btn"]').click()
    cy.get('[data-testid="toast"]').should('be.visible').contains('Published live')
  })
})
