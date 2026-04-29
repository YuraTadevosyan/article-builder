describe('Modals, AI panel, history, settings', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('[data-testid="new-article-btn"]').first().click()
  })

  context('Metadata Modal', () => {
    it('opens and closes metadata modal', () => {
      cy.get('[data-testid="metadata-btn"]').click()
      cy.get('[data-testid="modal"]').should('be.visible')
      cy.contains('Article metadata').should('be.visible')
      cy.get('[data-testid="modal"]').find('[title]').last().click()
      cy.get('[data-testid="modal"]').should('not.exist')
    })

    it('saves metadata and shows toast', () => {
      cy.get('[data-testid="metadata-btn"]').click()
      cy.get('[data-testid="meta-title-input"]').clear().type('Updated via Modal')
      cy.get('[data-testid="meta-save-btn"]').click()
      cy.get('[data-testid="modal"]').should('not.exist')
      cy.get('[data-testid="toast"]').should('contain', 'Metadata saved')
    })

    it('closes modal on Escape key', () => {
      cy.get('[data-testid="metadata-btn"]').click()
      cy.get('[data-testid="modal"]').should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('[data-testid="modal"]').should('not.exist')
    })
  })

  context('Export Modal', () => {
    it('opens export modal with markdown preview', () => {
      cy.get('[data-testid="export-btn"]').click()
      cy.get('[data-testid="modal"]').should('be.visible')
      cy.contains('Export article').should('be.visible')
      cy.get('[data-testid="export-format-md"]').should('be.visible')
    })

    it('switches export format to HTML', () => {
      cy.get('[data-testid="export-btn"]').click()
      cy.get('[data-testid="export-format-html"]').click()
      cy.contains('<!doctype html>').should('be.visible')
    })

    it('downloads and shows toast', () => {
      cy.get('[data-testid="export-btn"]').click()
      cy.get('[data-testid="export-download-btn"]').click()
      cy.get('[data-testid="toast"]').should('contain', 'Downloaded')
    })
  })

  context('AI Panel', () => {
    it('generates AI response', () => {
      cy.get('[data-testid="ai-toggle-btn"]').click()
      cy.get('[data-testid="ai-prompt-input"]').type('Tighten the intro')
      cy.get('[data-testid="ai-generate-btn"]').click()
      cy.get('[data-testid="ai-insert-btn"]', { timeout: 5000 }).should('be.visible')
    })

    it('inserts AI response into document', () => {
      cy.get('[data-testid="ai-toggle-btn"]').click()
      cy.get('[data-testid="ai-prompt-input"]').type('Add an example')
      cy.get('[data-testid="ai-generate-btn"]').click()
      cy.get('[data-testid="ai-insert-btn"]', { timeout: 5000 }).click()
      cy.get('[data-testid="toast"]').should('contain', 'Inserted into doc')
    })
  })

  context('History Page', () => {
    it('shows the initial draft snapshot in the timeline', () => {
      cy.get('[data-testid="nav-history"]').click()
      cy.get('[data-testid^="version-item-"]').should('have.length.greaterThan', 0)
    })

    it('captures a new revision when publishing', () => {
      cy.get('[data-testid="publish-btn"]').click()
      cy.get('[data-testid="nav-history"]').click()
      cy.get('[data-testid^="version-item-"]').should('have.length.greaterThan', 1)
    })

    it('restores an earlier revision', () => {
      // Create a second snapshot by publishing.
      cy.get('[data-testid="publish-btn"]').click()
      cy.get('[data-testid="nav-history"]').click()
      // The second item is the older "Initial draft" snapshot — current is first.
      cy.get('[data-testid^="version-item-"]').eq(1).click()
      cy.get('[data-testid="restore-btn"]').click()
      cy.get('[data-testid="toast"]').should('contain', 'Restored')
    })
  })

  context('Settings', () => {
    it('toggles dark theme', () => {
      cy.get('[data-testid="nav-settings"]').click()
      cy.get('[data-testid="theme-dark"]').click()
      cy.get('html').should('have.class', 'dark')
      cy.get('[data-testid="theme-light"]').click()
      cy.get('html').should('not.have.class', 'dark')
    })

    it('navigates between settings sections', () => {
      cy.get('[data-testid="nav-settings"]').click()
      cy.get('[data-testid="settings-nav-editor"]').click()
      cy.contains('Auto-save').should('be.visible')
      cy.get('[data-testid="settings-nav-shortcuts"]').click()
      cy.contains('Open command palette').should('be.visible')
    })

    it('changes the reading column width', () => {
      cy.get('[data-testid="nav-settings"]').click()
      cy.get('[data-testid="reading-wide"]').click()
      cy.get('[data-testid="reading-wide"]').should('have.css', 'background-color')
    })
  })
})
