#!/usr/bin/env python3

try:
    import pynut3
    print("pynut3 imported successfully")
    print("Available attributes:", dir(pynut3))
    
    # Try to instantiate PyNUT3Client
    if hasattr(pynut3, 'PyNUT3Client'):
        print('PyNUT3Client exists')
        try:
            client = pynut3.PyNUT3Client()
            print('PyNUT3Client instantiated:', client)
        except Exception as e:
            print('Error instantiating PyNUT3Client:', e)
    else:
        print('No PyNUT3Client class found')
except ImportError as e:
    print(f"Import error: {e}")
except Exception as e:
    print(f"Other error: {e}") 