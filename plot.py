import matplotlib.pyplot as plt
import numpy as np
import json
from typing import List, Tuple, Union
import pandas as pd
from pathlib import Path

def plot_elevation_profile(
    elevation_data: List[Tuple[float, float]], 
    title: str = "Elevation Profile",
    xlabel: str = "Distance (m)",
    ylabel: str = "Elevation (m)",
    figsize: Tuple[int, int] = (12, 6),
    save_path: str = None,
    show_grid: bool = True,
    color: str = 'blue',
    linewidth: float = 2.0
) -> None:
    """
    Plot elevation profile from a list of (distance, elevation) tuples.
    
    Args:
        elevation_data: List of (distance, elevation) tuples
        title: Plot title
        xlabel: X-axis label
        ylabel: Y-axis label
        figsize: Figure size as (width, height)
        save_path: Optional path to save the plot
        show_grid: Whether to show grid
        color: Line color
        linewidth: Line width
    """
    # Extract distances and elevations
    distances = [point[0] for point in elevation_data]
    elevations = [point[1] for point in elevation_data]
    
    # Handle NaN values
    valid_indices = [i for i, elev in enumerate(elevations) if not np.isnan(elev)]
    valid_distances = [distances[i] for i in valid_indices]
    valid_elevations = [elevations[i] for i in valid_indices]
    
    # Create the plot
    plt.figure(figsize=figsize)
    plt.plot(valid_distances, valid_elevations, color=color, linewidth=linewidth)
    
    # Customize the plot
    plt.title(title, fontsize=16, fontweight='bold')
    plt.xlabel(xlabel, fontsize=12)
    plt.ylabel(ylabel, fontsize=12)
    
     # Set custom tick intervals
    plt.xticks(np.arange(min(valid_distances), max(valid_distances), 5))  # 5 meters interval
    plt.yticks(np.arange(50, 101, 2))
    
    plt.ylim(50, 100)
    if show_grid:
        plt.grid(True, which='both', axis='both', alpha=0.3)
    
    # Add some statistics as text
    if valid_elevations:
        min_elev = min(valid_elevations)
        max_elev = max(valid_elevations)
        total_dist = max(valid_distances) if valid_distances else 0
        
        stats_text = f'Min: {min_elev:.1f}m\nMax: {max_elev:.1f}m\nTotal Distance: {total_dist:.1f}m'
        plt.text(0.02, 0.98, stats_text, transform=plt.gca().transAxes, 
                verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Plot saved to: {save_path}")
    
    plt.show()

def load_elevation_data_from_json(file_path: str) -> List[Tuple[float, float]]:
    """
    Load elevation profile data from a JSON file.
    Expected format: [[distance1, elevation1], [distance2, elevation2], ...]
    """
    with open(file_path, 'r') as f:
        data = json.load(f)
    return [(point[0], point[1]) for point in data]

def load_elevation_data_from_csv(file_path: str) -> List[Tuple[float, float]]:
    """
    Load elevation profile data from a CSV file.
    Expected columns: distance, elevation
    """
    df = pd.read_csv(file_path)
    return list(zip(df['distance'], df['elevation']))

def create_sample_data() -> List[Tuple[float, float]]:
    """Create sample elevation data for testing."""
    distances = np.linspace(0, 1000, 100)
    # Create a mountain-like elevation profile
    elevations = 100 + 50 * np.sin(distances / 200) + 20 * np.sin(distances / 50) + np.random.normal(0, 5, 100)
    return list(zip(distances, elevations))

def load_elevation_data_from_nodejs_json(file_path: str) -> Tuple[List[Tuple[float, float]], dict]:
    """
    Load elevation profile data from Node.js exported JSON file.
    Returns both the elevation data and metadata.
    """
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    elevation_profile = [(point[0], point[1]) for point in data['elevationProfile']]
    metadata = data.get('metadata', {})
    
    return elevation_profile, metadata

def create_enhanced_plot(
    elevation_data: List[Tuple[float, float]], 
    metadata: dict = None,
    output_dir: str = "./plots"
) -> None:
    """
    Create an enhanced elevation profile plot with metadata information.
    """
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Extract basic info
    distances = [point[0] for point in elevation_data]
    elevations = [point[1] for point in elevation_data]
    
    # Handle NaN values
    valid_indices = [i for i, elev in enumerate(elevations) if not np.isnan(elev)]
    valid_distances = [distances[i] for i in valid_indices]
    valid_elevations = [elevations[i] for i in valid_indices]
    
    if not valid_elevations:
        print("No valid elevation data to plot")
        return
    
    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))
    
    # Main elevation profile
    ax1.plot(valid_distances, valid_elevations, 'b-', linewidth=2, label='Elevation')
    ax1.fill_between(valid_distances, valid_elevations, alpha=0.3, color='lightblue')
    ax1.set_xlabel('Distance (m)', fontsize=12)
    ax1.set_ylabel('Elevation (m)', fontsize=12)
    ax1.grid(True, alpha=0.3)
    ax1.legend()
    
    # Statistics
    min_elev = min(valid_elevations)
    max_elev = max(valid_elevations)
    total_dist = max(valid_distances) if valid_distances else 0
    elevation_gain = max_elev - min_elev
    
    # Title with metadata
    title = "Elevation Profile"
    if metadata:
        point1 = metadata.get('point1', {})
        point2 = metadata.get('point2', {})
        if point1 and point2:
            title += f"\nFrom ({point1.get('x', 'N/A'):.4f}, {point1.get('y', 'N/A'):.4f}) to ({point2.get('x', 'N/A'):.4f}, {point2.get('y', 'N/A'):.4f})"
    
    ax1.set_title(title, fontsize=14, fontweight='bold')
    
    # Add statistics text box
    stats_text = f"""Statistics:
    • Total Distance: {total_dist:.1f} m
    • Min Elevation: {min_elev:.1f} m
    • Max Elevation: {max_elev:.1f} m
    • Elevation Gain: {elevation_gain:.1f} m
    • Avg Elevation: {np.mean(valid_elevations):.1f} m"""
    
    ax1.text(0.02, 0.98, stats_text, transform=ax1.transAxes, 
             verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))
    
    # Elevation gradient/slope analysis
    if len(valid_distances) > 1:
        gradients = []
        gradient_distances = []
        for i in range(1, len(valid_distances)):
            dist_diff = valid_distances[i] - valid_distances[i-1]
            elev_diff = valid_elevations[i] - valid_elevations[i-1]
            if dist_diff > 0:
                gradient = (elev_diff / dist_diff) * 100  # Convert to percentage
                gradients.append(gradient)
                gradient_distances.append(valid_distances[i])
        
        if gradients:
            ax2.plot(gradient_distances, gradients, 'r-', linewidth=1.5, label='Gradient (%)')
            ax2.axhline(y=0, color='k', linestyle='-', alpha=0.3)
            ax2.fill_between(gradient_distances, gradients, alpha=0.3, color='lightcoral')
            ax2.set_xlabel('Distance (m)', fontsize=12)
            ax2.set_ylabel('Gradient (%)', fontsize=12)
            ax2.set_title('Elevation Gradient', fontsize=12, fontweight='bold')
            ax2.grid(True, alpha=0.3)
            ax2.legend()
    
    plt.tight_layout()
    
    # Save the plot
    timestamp = metadata.get('timestamp', 'unknown') if metadata else 'unknown'
    safe_timestamp = timestamp.replace(':', '-').replace('T', '_').split('.')[0]
    filename = f"elevation_profile_{safe_timestamp}.png"
    filepath = Path(output_dir) / filename
    
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    print(f"Enhanced plot saved to: {filepath}")
    plt.show()

# Example usage
if __name__ == "__main__":
    # Try to load data from Node.js exports
    json_paths = [
        "./elevation_data/elevation_profile.json",
        "./elevation_profile.json",
        "elevation_profile.json"
    ]
    
    csv_paths = [
        "./elevation_data/elevation_profile.csv",
        "./elevation_profile.csv",
        "elevation_profile.csv"
    ]
    
    data_loaded = False
    
    # Try to load JSON data (with metadata)
    for json_path in json_paths:
        try:
            print(f"Trying to load: {json_path}")
            elevation_data, metadata = load_elevation_data_from_nodejs_json(json_path)
            print(f"✓ Loaded elevation data from {json_path}")
            print(f"  - Number of data points: {len(elevation_data)}")
            if metadata:
                print(f"  - Generated: {metadata.get('timestamp', 'Unknown')}")
                print(f"  - CRS: {metadata.get('inputCRS', 'Unknown')}")
            
            # Create enhanced plot
            create_enhanced_plot(elevation_data, metadata)
            
            # Also create simple plot
            plot_elevation_profile(
                elevation_data,
                title="Simple Elevation Profile",
                save_path="simple_elevation_profile.png"
            )
            
            data_loaded = True
            break
            
        except FileNotFoundError:
            continue
        except Exception as e:
            print(f"Error loading {json_path}: {e}")
            continue
    
    # If JSON failed, try CSV
    if not data_loaded:
        for csv_path in csv_paths:
            try:
                print(f"Trying to load: {csv_path}")
                elevation_data = load_elevation_data_from_csv(csv_path)
                print(f"✓ Loaded elevation data from {csv_path}")
                print(f"  - Number of data points: {len(elevation_data)}")
                
                plot_elevation_profile(
                    elevation_data,
                    title="Elevation Profile from CSV",
                    save_path="elevation_profile_from_csv.png"
                )
                
                data_loaded = True
                break
                
            except FileNotFoundError:
                continue
            except Exception as e:
                print(f"Error loading {csv_path}: {e}")
                continue
    
    # If no data found, create sample data
    if not data_loaded:
        print("No elevation data files found. Creating sample data for demonstration...")
        sample_data = create_sample_data()
        plot_elevation_profile(
            sample_data,
            title="Sample Elevation Profile",
            xlabel="Distance (m)",
            ylabel="Elevation (m)",
            save_path="sample_elevation_profile.png"
        )
        print("Run your Node.js code first to generate actual elevation data!")