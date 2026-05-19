# Implementation Plan - Phase 142: Universal SmartLookup Restoration

This phase restores functionality to all relational dropdowns (SmartLookups) across the application by aligning the backend API with the actual PostgreSQL table names found in the MS Access migration dump.

## User Review Required

> [!IMPORTANT]
> - **Table Name Corrections**: I discovered that the `lookup.js` controller was targeting tables without the `ext_` prefix (e.g., `bacterial_species`), whereas the actual database uses `ext_bacterial_species`. I will update ALL 15+ lookup routes to match the database reality.
> - **Data Integrity**: This will instantly fix "blank dropdowns" in Phage Entry, Strain Entry, inventory forms, and more.
> - **Casting Robustness**: I will implement strict column mapping to handle cases where labeling columns have non-standard names (like `Field1` for primer binding targets).

## Proposed Changes

### [Backend] server/routes/lookup.js

#### [MODIFY] [lookup.js](file:///d:/Bacteriophage_LIMS/server/routes/lookup.js)
- **Table Remapping**:
    - `bacterial_species` ➔ `ext_bacterial_species`
    - `phage_names` ➔ `ext_bacteriophage_names`
    - `plasmid_vectors` ➔ `ext_plasmid_vectors`
    - `freezer_locations` ➔ `ext_location_detail_freezer`
    - `rack_locations` ➔ `ext_location_detail_rack`
    - `box_locations` ➔ `ext_location_detail_box_name`
    - `lytic_lysogenic_types` ➔ `ext_lytic_lysogenic`
    - `manufacturers` ➔ `ext_manufacturers`
    - `stock_categories` ➔ `ext_stock_category`
    - `gene_sources` ➔ `ext_gene_sources`? (Verifying if this exists or if it's part of another table)
    - `primer_binding_organism_types` ➔ `ext_primer_binding_organism_type`
- **Fallback Logic**: Keep safe fallback arrays for critical lookups like `wild-type-recomb` if the table is truly empty.

## Verification Plan

### Automated Verification
- I will verify the updated routes by checking the `MERGED DATA` logic and ensuring no more 500 errors in the server logs.

### Manual Verification
1. Open the **Strain Entry** page.
2. Click the **Species** dropdown. Verify it is populated with actual names (e.g., *Staphylococcus aureus*).
3. Open the **Inventory Entry** page.
4. Verify **Manufacturer** and **Storage Box** dropdowns are populated.
5. Verify that selecting a value correctly saves the ID to the database.
