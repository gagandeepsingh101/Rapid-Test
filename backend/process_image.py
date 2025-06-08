import cv2
import numpy as np
import sys
import json
import os

def validate_image_quality(img):
    """Step 2: Image Quality Validation"""
    # Uncomment and adjust these checks if needed for blur or brightness validation
    # laplacian = cv2.Laplacian(img, cv2.CV_64F).var()
    # if laplacian < 100 :
    #     return False, "Image too blurry"
    # hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # brightness = np.mean(hsv[:, :, 2])
    # if brightness < 50 or brightness > 200:
    #     return False, "Improper lighting"
    return True, None

def detect_test_strip(img):
    """Step 3: Test Strip Detection"""
    if img is None or img.size == 0:
        return False, "Invalid or empty image"
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        approx = cv2.approxPolyDP(contour, 0.02 * cv2.arcLength(contour, True), True)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / float(h)
            if 5 < aspect_ratio < 20 and w > 50 and h > 5:
                # Save detected strip for debugging
                # cv2.imwrite("debug_strip.jpg", img[y:y+h, x:x+w])
                return True, (x, y, w, h)
    return False, "Test strip not detected"

def extract_line_regions(img, strip_rect):
    """Step 4: Line Region Extraction"""
    x, y, w, h = strip_rect
    strip = img[y:y+h, x:x+w]
    control_y = int(h * 0.25)
    test_y = int(h * 0.5)
    line_height = int(h * 0.1)
    control_region = strip[control_y - line_height:control_y + line_height, :]
    test_region = strip[test_y - line_height:test_y + line_height, :]
    
    # Save regions for debugging
    # cv2.imwrite("debug_control_region.jpg", control_region)
    # cv2.imwrite("debug_test_region.jpg", test_region)
    return control_region, test_region

def analyze_color(region, color_rgb=(180, 50, 50)):
    """Step 5: Color Analysis"""
    if region is None or region.size == 0:
        return 0.0, 0.0
    hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
    lower_bound = np.array([140, 50, 50])
    upper_bound = np.array([180, 255, 255])
    mask = cv2.inRange(hsv, lower_bound, upper_bound)
    color_pixels = cv2.countNonZero(mask)
    total_pixels = mask.size
    color_ratio = color_pixels / total_pixels
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = cv2.countNonZero(edges) / edges.size
    return color_ratio, edge_density

def make_decision(control_ratio, test_ratio, control_edge, test_edge):
    """Step 6: Rule-Based Decision"""
    CONTROL_THRESHOLD = 0.05
    POSITIVE_THRESHOLD = 0.05
    NEGATIVE_THRESHOLD = 0.01

    if control_ratio < CONTROL_THRESHOLD or control_edge < 0.01:
        return "Invalid Test", 0.0
    if test_ratio > POSITIVE_THRESHOLD and test_edge > 0.01:
        return "Positive", test_ratio
    elif test_ratio < NEGATIVE_THRESHOLD:
        return "Negative", test_ratio
    else:
        return "Unclear", test_ratio

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input image path provided"}))
            sys.exit(1)

        input_path = sys.argv[1]
        output_path = f"Uploads/output_{os.path.basename(input_path)}"

        # Verify file existence
        if not os.path.exists(input_path):
            print(json.dumps({"error": f"Image file not found: {input_path}"}))
            sys.exit(1)

        sys.stderr.write(f"Reading image: {input_path}\n")
        img = cv2.imread(input_path)
        if img is None or img.size == 0:
            print(json.dumps({"error": f"Failed to load image: {input_path}. Check if the file is a valid image."}))
            sys.exit(1)
        sys.stderr.write(f"Image loaded successfully, dimensions: {img.shape}\n")

        # Step 2: Validate image quality
        is_valid, error = validate_image_quality(img)
        if not is_valid:
            print(json.dumps({"error": error}))
            sys.exit(1)

        # Step 3: Detect test strip
        strip_found, strip_rect = detect_test_strip(img)
        if not strip_found:
            print(json.dumps({"error": strip_rect}))
            sys.exit(1)

        # Step 4: Extract line regions
        control_region, test_region = extract_line_regions(img, strip_rect)

        # Step 5: Color analysis
        control_color_ratio, control_edge_density = analyze_color(control_region)
        test_color_ratio, test_edge_density = analyze_color(test_region)

        # Step 6: Rule-based decision
        result, confidence = make_decision(control_color_ratio, test_color_ratio, 
                                          control_edge_density, test_edge_density)

        # Save processed image
        os.makedirs("Uploads", exist_ok=True)  # Ensure Uploads folder exists
        cv2.imwrite(output_path, img)
        sys.stderr.write(f"Saved output image: {output_path}\n")

        # Step 7: JSON output
        output = {
            "status": "success",
            "result": result,
            "confidence": float(confidence),
            "output_image": output_path
        }
        # Add color intensities for Positive or Negative results
        if result in ["Positive", "Negative"]:
            output["control_color_intensity"] = float(control_color_ratio)
            output["test_color_intensity"] = float(test_color_ratio)
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": f"Script error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()