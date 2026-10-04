import statsapi
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

# Configuration
START_DATE = '04/01/2023'
END_DATE = '10/01/2023'
OUTPUT_FILE = 'mlb_historical_data.csv'

def fetch_mlb_data(start_date, end_date):
    print(f"Fetching real MLB schedule data from {start_date} to {end_date}...")
    games = statsapi.schedule(start_date=start_date, end_date=end_date)
    dataset = []
    
    for game in games:
        if game['status'] != 'Final':
            continue
            
        # Basic Stats (Real)
        home_score = game.get('home_score', 0)
        away_score = game.get('away_score', 0)
        home_hits = game.get('home_hits', 0)
        away_hits = game.get('away_hits', 0)
        home_errors = game.get('home_errors', 0)
        away_errors = game.get('away_errors', 0)
        inning_count = game.get('current_inning', 9)
        
        # Advanced Stats & Odds (Mocked for testing speed)
        home_pitcher_era = np.random.uniform(2.50, 6.50)
        away_pitcher_era = np.random.uniform(2.50, 6.50)
        wind_speed = np.random.uniform(0.0, 25.0)
        temperature = np.random.uniform(45.0, 105.0)
        home_moneyline = np.random.uniform(-250, 250)
        over_under_total = np.random.choice([7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0])

        # Compile 20 dimensions for specific game
        game_vector = [
            home_score, away_score, home_hits, away_hits, home_errors, away_errors, inning_count, 
            home_pitcher_era, away_pitcher_era, wind_speed, temperature, home_moneyline, over_under_total, 
            # Padding to hit 20 dimensions
            np.random.uniform(0, 1), np.random.uniform(0, 1), np.random.uniform(0, 1), 
            np.random.uniform(0, 1), np.random.uniform(0, 1), np.random.uniform(0, 1), np.random.uniform(0, 1)
        ]
        dataset.append(game_vector)
        
    # Duplicate dataset to inflate to 3,000,000 rows for performance test
    massive_dataset = dataset * (3000000 // len(dataset))
    return pd.DataFrame(massive_dataset[:3000000])

def normalize_and_export(df, output_filename):
    print("Normalizing dimensions to 0.0 - 1.0 scale...")
    scaler = MinMaxScaler()
    normalized_data = scaler.fit_transform(df)
    normalized_df = pd.DataFrame(normalized_data)
    
    print(f"Exporting data to {output_filename}...")
    normalized_df.to_csv(output_filename, header=False, index=False)
    print("Export complete. Ready for CUDA.")

if __name__ == "__main__":
    raw_df = fetch_mlb_data(START_DATE, END_DATE)
    if not raw_df.empty:
        normalize_and_export(raw_df, OUTPUT_FILE)