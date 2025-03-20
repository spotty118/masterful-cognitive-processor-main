#!/usr/bin/env python3
import os
import argparse
import shutil
from find_duplicates import find_duplicates, get_file_hash
from collections import defaultdict

def remove_duplicates(directory, dry_run=True, strategy="keep_first", symlink=False, exclude_dirs=None):
    """
    Remove duplicate files, with option to create symbolic links
    
    Strategies:
    - keep_first: Keep the first file found, remove others
    - keep_shortest_path: Keep the file with the shortest path, remove others
    """
    if exclude_dirs is None:
        exclude_dirs = ['.git', 'node_modules', '__pycache__']
    
    # Find all files and their hashes
    hash_dict = defaultdict(list)
    
    for root, dirs, files in os.walk(directory):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for filename in files:
            filepath = os.path.join(root, filename)
            try:
                file_hash = get_file_hash(filepath)
                hash_dict[file_hash].append(filepath)
            except (IOError, PermissionError):
                continue
    
    # Find duplicates
    duplicates = {file_hash: paths for file_hash, paths in hash_dict.items() if len(paths) > 1}
    
    if not duplicates:
        print("No duplicate files found.")
        return
    
    # Process each set of duplicates
    for file_hash, paths in duplicates.items():
        # Determine which file to keep based on strategy
        if strategy == "keep_shortest_path":
            paths.sort(key=lambda p: len(p))
        # keep_first strategy is default (just use the first file in the list)
        
        keep_file = paths[0]
        remove_files = paths[1:]
        
        print(f"For duplicate set (hash: {file_hash}):")
        print(f"  Keeping: {keep_file}")
        
        for remove_file in remove_files:
            if dry_run:
                if symlink:
                    print(f"  Would remove {remove_file} and create symlink to {keep_file}")
                else:
                    print(f"  Would remove {remove_file}")
            else:
                try:
                    os.remove(remove_file)
                    print(f"  Removed: {remove_file}")
                    
                    if symlink:
                        # Create relative path for symlink
                        remove_dir = os.path.dirname(remove_file)
                        rel_path = os.path.relpath(keep_file, remove_dir)
                        os.symlink(rel_path, remove_file)
                        print(f"  Created symlink from {remove_file} to {rel_path}")
                except OSError as e:
                    print(f"  Error removing {remove_file}: {e}")
        print()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Remove duplicate files')
    parser.add_argument('directory', nargs='?', default='.', help='Directory to scan (default: current directory)')
    parser.add_argument('--no-dry-run', action='store_true', help='Actually remove files (default is dry-run)')
    parser.add_argument('--strategy', choices=['keep_first', 'keep_shortest_path'], default='keep_shortest_path', 
                        help='Strategy for choosing which file to keep (default: keep_shortest_path)')
    parser.add_argument('--symlink', action='store_true', help='Create symbolic links to kept file')
    parser.add_argument('--exclude', nargs='+', help='Directories to exclude')
    args = parser.parse_args()
    
    exclude_dirs = ['.git', 'node_modules', '__pycache__']
    if args.exclude:
        exclude_dirs.extend(args.exclude)
    
    remove_duplicates(
        args.directory,
        dry_run=not args.no_dry_run,
        strategy=args.strategy,
        symlink=args.symlink,
        exclude_dirs=exclude_dirs
    )
