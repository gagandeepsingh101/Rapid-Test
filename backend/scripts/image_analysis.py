import cv2
import numpy as np
import sys
import json
import io
from PIL import Image

def validate_image_quality(img):
    # Check if image is valid
    if img is None or img.size == 0:
        return False, "Invalid or empty image"
    
    # Convert to grayscale for blur detection
    # gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # laplacian = cv2.Laplacian(gray, cv2.CV_64F).var()
    # if laplacian < 50:
    #     return False, f"Image too blurry (Laplacian variance: {laplacian})"
    
    # # Check brightness
    # hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # brightness = np.mean(hsv[:, :, 2])
    # if brightness < 50 or brightness > 200:
    #     return False, "Improper lighting"
    
    return True, None

def detect_test_strip(img):
    # Resize image to a standard width for consistency
    height, width = img.shape[:2]
    scale = 500 / width
    img_resized = cv2.resize(img, None, fx=scale, fy=scale)
    
    # Convert to grayscale and apply adaptive thresholding
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY_INV, 11, 2)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        # Approximate the contour to a polygon
        approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
        if len(approx) == 4:  # Look for rectangular shapes
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / float(h)
            
            # Adjust aspect ratio for pregnancy test sticks (typically long and narrow)
            if 2 < aspect_ratio < 10 and w > 100 and h > 20:
                # Scale back coordinates to original image size
                x, y, w, h = int(x/scale), int(y/scale), int(w/scale), int(h/scale)
                return True, (x, y, w, h)
    
    return False, "Test strip not detected"

def extract_line_regions(img, strip_rect):
    x, y, w, h = strip_rect
    strip = img[y:y+h, x:x+w]
    
    # Adjust the positions for control and test lines based on typical pregnancy test layout
    control_y = int(h * 0.3)  # Control line is usually higher up
    test_y = int(h * 0.6)     # Test line is below the control line
    line_height = int(h * 0.15)  # Slightly larger region to capture the line
    
    control_region = strip[max(control_y - line_height, 0):control_y + line_height, :]
    test_region = strip[max(test_y - line_height, 0):test_y + line_height, :]
    
    return control_region, test_region

def analyze_color(region):
    # Convert to HSV to detect pink/red lines (typical for pregnancy tests)
    hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
    
    # Define range for pink/red colors (HCG test lines are often pink/red)
    lower_bound = np.array([140, 50, 50])
    upper_bound = np.array([180, 255, 255])
    mask = cv2.inRange(hsv, lower_bound, upper_bound)
    
    # Calculate the ratio of pink/red pixels
    color_pixels = cv2.countNonZero(mask)
    total_pixels = mask.size
    color_ratio = color_pixels / total_pixels if total_pixels > 0 else 0
    
    # Edge detection for line clarity
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = cv2.countNonZero(edges) / edges.size if edges.size > 0 else 0
    
    return color_ratio, edge_density

def make_decision(control_ratio, test_ratio, control_edge, test_edge):
    CONTROL_THRESHOLD = 0.03  # Lowered threshold for control line detection
    POSITIVE_THRESHOLD = 0.02  # Lowered threshold for test line detection
    NEGATIVE_THRESHOLD = 0.005  # Threshold for negative result
    
    # Check if control line is present (valid test)
    if control_ratio < CONTROL_THRESHOLD or control_edge < 0.005:
        return "Invalid", 0.0
    
    # Check for test line
    if test_ratio > POSITIVE_THRESHOLD and test_edge > 0.005:
        return "Positive", test_ratio
    elif test_ratio < NEGATIVE_THRESHOLD:
        return "Negative", test_ratio
    else:
        return "Unclear", test_ratio

def main():
    try:
        # Read binary image from stdin
        image_chunks = []
        while True:
            chunk = sys.stdin.buffer.read(4096)
            if not chunk:
                break
            image_chunks.append(chunk)
        image_data = b''.join(image_chunks)

        if not image_data:
            print(json.dumps({"error": "No image data received"}))
            sys.exit(1)

        # Open the image using PIL and convert to OpenCV format
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Validate image quality
        is_valid, error = validate_image_quality(img)
        if not is_valid:
            print(json.dumps({"error": error}))
            sys.exit(1)

        # Detect test strip
        strip_found, strip_rect = detect_test_strip(img)
        if not strip_found:
            print(json.dumps({"error": strip_rect}))
            sys.exit(1)

        # Extract control and test regions
        control_region, test_region = extract_line_regions(img, strip_rect)

        # Analyze colors and edges
        control_ratio, control_edge = analyze_color(control_region)
        test_ratio, test_edge = analyze_color(test_region)

        # Make decision
        result, confidence = make_decision(control_ratio, test_ratio, control_edge, test_edge)

        # Output result
        print(json.dumps({
            "status": result,
            "confidence": round(float(confidence), 4),
            "controlIntensity": round(control_ratio, 4),
            "testIntensity": round(test_ratio, 4)
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()