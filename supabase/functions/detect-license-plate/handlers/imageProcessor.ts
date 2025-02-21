
import { RekognitionService } from "../services/rekognition.ts";

export async function downloadImage(imageUrl: string): Promise<ArrayBuffer> {
  console.log('Downloading image from:', imageUrl);
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Image download failed:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    console.log('Image downloaded successfully:', {
      size: buffer.byteLength,
      type: response.headers.get('content-type')
    });
    
    return buffer;
  } catch (error) {
    console.error('Error downloading image:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export async function processImage(imageUrl: string) {
  try {
    console.log('Starting image processing for:', imageUrl);
    
    // Download and process image
    const imageBuffer = await downloadImage(imageUrl);
    console.log('Image downloaded, size:', imageBuffer.byteLength);

    console.log('Initializing Rekognition service...');
    const rekognition = new RekognitionService();

    // First detect text to find license plate
    console.log('Detecting text in image...');
    const textResponse = await rekognition.detectText(imageBuffer);
    console.log('Text detection completed:', textResponse);

    if (!textResponse.TextDetections || textResponse.TextDetections.length === 0) {
      console.warn('No text detected in image');
      throw new Error('No text detected in image');
    }

    // Find license plate - looking for LINE text that matches license plate pattern
    const detectedText = textResponse.TextDetections || [];
    console.log('Processing detected text:', 
      detectedText.map(t => ({
        text: t.DetectedText,
        type: t.Type,
        confidence: t.Confidence
      }))
    );

    // Look for text that matches license plate patterns
    const licensePlate = detectedText.find(text => 
      text.Type === 'LINE' && 
      text.DetectedText && 
      /^[A-Z0-9]{5,8}$/.test(text.DetectedText.replace(/\s/g, ''))
    );

    if (!licensePlate) {
      console.warn('No valid license plate pattern found in detected text');
      throw new Error('No valid license plate detected in image');
    }

    // Then detect labels to identify vehicle type
    console.log('Detecting labels in image...');
    const labelsResponse = await rekognition.detectLabels(imageBuffer);
    console.log('Label detection completed:', labelsResponse);

    const vehicleLabels = labelsResponse.Labels?.filter(label => 
      ['Car', 'Automobile', 'Vehicle', 'Truck', 'Van', 'SUV', 'Pickup Truck'].includes(label.Name || '')
    ) || [];
    
    console.log('Found vehicle labels:', 
      vehicleLabels.map(l => ({
        name: l.Name,
        confidence: l.Confidence
      }))
    );
    
    const vehicleType = vehicleLabels.length > 0 ? vehicleLabels[0].Name : "Unknown";

    // Return processed results
    const result = {
      license_plate: licensePlate.DetectedText?.replace(/\s/g, ''),
      confidence: licensePlate.Confidence ? licensePlate.Confidence / 100 : 0,
      vehicle_type: vehicleType,
      vehicle_details: {
        detected_text: detectedText.map(text => ({
          text: text.DetectedText,
          type: text.Type,
          confidence: text.Confidence ? text.Confidence / 100 : 0,
        })),
        labels: labelsResponse.Labels?.map(label => ({
          name: label.Name,
          confidence: label.Confidence ? label.Confidence / 100 : 0,
        }))
      },
      bounding_box: licensePlate.Geometry?.BoundingBox || null
    };

    console.log('Processing complete, returning result:', result);
    return result;

  } catch (error) {
    console.error('Error in processImage:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
