import pyodbc
import json
import re

ACCDB_PATH = r"D:\Bacteriophage_LIMS\Bacteriophage-MMG- Updated.accdb"
OUTPUT_PATH = r"D:\Bacteriophage_LIMS\server\scripts\universal_schema_truth.json"

TARGET_TABLES = [
    "-80 Freezer stoage details-final",
    "-80 Freezer storage details",
    "Antibiotics",
    "Available Antibiotics Discs",
    "Bacterial Species",
    "Bacterial Strains",
    "Bacteriophage Names",
    "Bacteriophages",
    "Chemical Storage Area details",
    "Cloninig Methods",
    "Gene Source",
    "Host Bacteria",
    "Lab-Stock",
    "Location detail-Box name",
    "Location detail-freezer",
    "Location detail-Rack",
    "Lytic-lysogenic",
    "Manufacturers",
    "Plasmid Vectors",
    "PLasmids",
    "Primer binding organism type",
    "Primers-details",
    "Sheet1",
    "Stock Category",
    "Wild-type-recomb"
]

def main():
    conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCDB_PATH};'
    try:
        conn = pyodbc.connect(conn_str)
    except Exception as e:
        print(f"FAILED TO CONNECT TO DB: {e}")
        return

    cur = conn.cursor()
    result = {}

    for table in TARGET_TABLES:
        print(f"\nScanning Table: {table}")
        
        table_info = {
            "access_name": table,
            "columns": [],
            "relational_columns": [],
            "multi_select_columns": []
        }
        
        try:
            cur.execute(f"SELECT TOP 50 * FROM [{table}]")
            rows = cur.fetchall()
            cols = [c[0] for c in cur.description]
            
            col_types = {}
            for col_desc in cur.description:
                col_types[col_desc[0]] = col_desc[1]
            
            for col in cols:
                col_entry = {
                    "name": col,
                    "type": str(col_types.get(col, 'unknown')),
                    "is_relational": False,
                    "multi_select": False,
                    "delimiter": None,
                    "sample_values": []
                }
                
                samples = []
                for row in rows:
                    val = row[cols.index(col)]
                    if val is not None and str(val).strip():
                        samples.append(str(val).strip())
                
                col_entry["sample_values"] = list(set(samples[:10]))
                
                # Relational Detection
                numeric_count = 0
                semicolon_count = 0
                comma_multi_count = 0
                
                for s in samples:
                    if re.match(r'^\d+$', s.strip()):
                        numeric_count += 1
                    elif re.match(r'^\d+(?:;\d+)+$', s.strip()):
                        semicolon_count += 1
                    elif re.match(r'^\d+(?:,\d+)+$', s.strip()):
                        comma_multi_count += 1
                
                total = len(samples)
                if total > 0:
                    numericRatio = (numeric_count + semicolon_count + comma_multi_count) / total
                    
                    if semicolon_count > 0 or comma_multi_count > 0:
                        col_entry["is_relational"] = True
                        col_entry["multi_select"] = True
                        col_entry["delimiter"] = ";" if semicolon_count >= comma_multi_count else ","
                    elif numeric_count > 0 and numericRatio > 0.5:
                        col_entry["is_relational"] = True
                        col_entry["multi_select"] = False
                
                table_info["columns"].append(col_entry)
                if col_entry["is_relational"]:
                    table_info["relational_columns"].append(col)
                if col_entry["multi_select"]:
                    table_info["multi_select_columns"].append(col)
                    
        except Exception as e:
            print(f"  Error reading {table}: {e}")
            table_info["error"] = str(e)
            
        result[table] = table_info
        print(f"  > Relational: {table_info['relational_columns']}")
        print(f"  > Multi-Select: {table_info['multi_select_columns']}")

    conn.close()

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    print(f"\nUniversal schema successfully saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
