import pandas as pd

# Load Excel file (change the filename if needed)
df = pd.read_excel('Book.xlsx', engine='openpyxl')

# Convert to JSON and save
df.to_json('data.json', orient='records', indent=2)
