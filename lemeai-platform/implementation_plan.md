# Implementation Plan - Opportunity API Integration

## Goal Description
Integrate the `GET /api/OportunidadeVenda/BuscarTodas` API to the "Oportunidade de Vendas" (Pipeline) page to display real opportunity data.

## Proposed Changes

### Services
#### [NEW] [OpportunityService.ts](file:///c:/Git/lemeai.platform/lemeai-platform/src/services/OpportunityService.ts)
- Create `OpportunityService.ts`.
- Define `Opportunity` interface matching the API response.
  - Note: The API response has a typo `idStauts`. I will use `idStatus` in my clean interface and map it, or use the raw key if necessary. I'll match the JSON for the raw interface.
- Implement `getAllOpportunities` to fetch from `/api/OportunidadeVenda/BuscarTodas`.

### Pages
#### [MODIFY] [PipelinePage.tsx](file:///c:/Git/lemeai.platform/lemeai-platform/src/pages/PipelinePage.tsx)
- Import `OpportunityService`.
- Replace `fetchConversations` logic to use `OpportunityService.getAllOpportunities()`.
- Map the API response fields to the `Deal` interface used by the Kanban board:
  - `idConversa` -> `id`
  - `nomeContato` -> `title`
  - `dataConversaCriada` -> `date`
  - `idStauts` -> `statusId` (Map status IDs if necessary to `INITIAL_COLUMNS`)
  - `valor` -> `value` (Note: API response sample doesn't show `valor`, so might default to 0 or check if it's missing)

## Verification Plan
### Manual Verification
- Start the dev server.
- Visit the Pipeline page.
- Verify opportunities load.
