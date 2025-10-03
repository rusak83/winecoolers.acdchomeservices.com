import re
import sys

def update_gtm_tags(file_path, brand_name):
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace GTM-5VC7HCPG with GTM-KRWMRCGX everywhere
    content = content.replace('GTM-5VC7HCPG', 'GTM-KRWMRCGX')
    
    # Add Data Layer script right after <head> tag and before existing GTM script
    head_pattern = r'(<head>\s*)(<!-- Google Tag Manager -->)'
    
    data_layer_script = f'''<script>
        window.dataLayer = window.dataLayer || [];
        dataLayer.push({{
            'brandName': '{brand_name}' 
        }});
    </script>

    '''
    
    replacement = r'\1' + data_layer_script + r'\2'
    content = re.sub(head_pattern, replacement, content)
    
    # Write the updated file
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f'Updated {file_path} with new GTM tags and {brand_name} Data Layer')

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python update_gtm.py <file_path> <brand_name>")
        sys.exit(1)
    
    update_gtm_tags(sys.argv[1], sys.argv[2])
