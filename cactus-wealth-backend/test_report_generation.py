#!/usr/bin/env python3
"""
Test script for PDF report generation functionality.
This script tests the template rendering without database dependencies.
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# Add the src directory to the Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

try:
    from jinja2 import Environment, FileSystemLoader
    import weasyprint
    print("✅ Dependencies imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install the required dependencies:")
    print("pip install jinja2 weasyprint")
    sys.exit(1)


def test_template_rendering():
    """Test that the HTML template renders correctly."""
    print("\n🧪 Testing template rendering...")
    
    # Setup Jinja2 environment
    templates_dir = current_dir / "src" / "cactus_wealth" / "templates"
    
    if not templates_dir.exists():
        print(f"❌ Templates directory not found: {templates_dir}")
        return False
    
    env = Environment(loader=FileSystemLoader(str(templates_dir)))
    
    # Mock data for testing
    mock_data = {
        'portfolio_id': 1,
        'portfolio_name': 'Test Portfolio',
        'total_value': 25000.00,
        'total_cost_basis': 20000.00,
        'total_pnl': 5000.00,
        'total_pnl_percentage': 25.00,
        'positions_count': 3,
        'last_updated': datetime.utcnow(),
        'report_date': datetime.utcnow(),
        'positions': [
            type('MockPosition', (), {
                'asset': type('MockAsset', (), {
                    'ticker_symbol': 'AAPL',
                    'name': 'Apple Inc.',
                    'asset_type': type('MockAssetType', (), {'value': 'STOCK'})()
                })(),
                'quantity': 100,
                'purchase_price': 150.00,
                'current_price': 175.00
            })(),
            type('MockPosition', (), {
                'asset': type('MockAsset', (), {
                    'ticker_symbol': 'MSFT',
                    'name': 'Microsoft Corporation',
                    'asset_type': type('MockAssetType', (), {'value': 'STOCK'})()
                })(),
                'quantity': 50,
                'purchase_price': 200.00,
                'current_price': 250.00
            })(),
            type('MockPosition', (), {
                'asset': type('MockAsset', (), {
                    'ticker_symbol': 'SPY',
                    'name': 'SPDR S&P 500 ETF Trust',
                    'asset_type': type('MockAssetType', (), {'value': 'ETF'})()
                })(),
                'quantity': 25,
                'purchase_price': 400.00,
                'current_price': 420.00
            })()
        ]
    }
    
    try:
        # Load and render template
        template = env.get_template('report.html')
        html_content = template.render(**mock_data)
        
        print("✅ Template rendered successfully")
        print(f"   HTML length: {len(html_content)} characters")
        
        # Save test HTML for inspection
        test_html_path = current_dir / "test_report.html"
        with open(test_html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"   Test HTML saved to: {test_html_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Template rendering failed: {e}")
        return False


def test_pdf_generation():
    """Test that PDF generation works."""
    print("\n📄 Testing PDF generation...")
    
    templates_dir = current_dir / "src" / "cactus_wealth" / "templates"
    
    # Simple HTML for PDF test
    test_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="styles.css">
        <style>
            body {{ font-family: Arial, sans-serif; padding: 20px; }}
            .test-content {{ color: #2E5339; font-size: 18px; }}
        </style>
    </head>
    <body>
        <h1>🌵 Cactus Wealth - Test Report</h1>
        <div class="test-content">
            <p>This is a test PDF generation.</p>
            <p>Generated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </body>
    </html>
    """
    
    try:
        # Generate PDF
        base_url = f"file://{templates_dir}/"
        pdf_bytes = weasyprint.HTML(
            string=test_html,
            base_url=base_url
        ).write_pdf()
        
        print("✅ PDF generated successfully")
        print(f"   PDF size: {len(pdf_bytes)} bytes")
        
        # Save test PDF
        test_pdf_path = current_dir / "test_report.pdf"
        with open(test_pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        
        print(f"   Test PDF saved to: {test_pdf_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ PDF generation failed: {e}")
        return False


def main():
    """Run all tests."""
    print("🧪 Testing Cactus Wealth PDF Report Generation")
    print("=" * 50)
    
    # Check if templates exist
    templates_dir = current_dir / "src" / "cactus_wealth" / "templates"
    
    if not templates_dir.exists():
        print(f"❌ Templates directory not found: {templates_dir}")
        return False
    
    html_template = templates_dir / "report.html"
    css_template = templates_dir / "styles.css"
    
    if not html_template.exists():
        print(f"❌ HTML template not found: {html_template}")
        return False
    
    if not css_template.exists():
        print(f"❌ CSS template not found: {css_template}")
        return False
    
    print(f"✅ Templates directory found: {templates_dir}")
    print(f"✅ HTML template found: {html_template}")
    print(f"✅ CSS template found: {css_template}")
    
    # Run tests
    template_ok = test_template_rendering()
    pdf_ok = test_pdf_generation()
    
    print("\n" + "=" * 50)
    if template_ok and pdf_ok:
        print("🎉 All tests passed! PDF report generation is ready.")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    
    return template_ok and pdf_ok


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 