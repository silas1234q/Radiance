import ExpoModulesCore
import Vision
import UIKit

extension CGImagePropertyOrientation {
  init(_ o: UIImage.Orientation) {
    switch o {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}

public class AppleFaceDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleFaceDetector")

    AsyncFunction("detectFaces") { (uri: String) -> [String: Any] in
      guard let url = URL(string: uri),
            let data = try? Data(contentsOf: url),
            let image = UIImage(data: data),
            let cg = image.cgImage else {
        return ["width": 0, "height": 0, "faces": []]
      }

      // UIImage.size is already orientation-adjusted
      let w = Double(image.size.width * image.scale)
      let h = Double(image.size.height * image.scale)

      let request = VNDetectFaceRectanglesRequest()
      let handler = VNImageRequestHandler(
        cgImage: cg,
        orientation: CGImagePropertyOrientation(image.imageOrientation),
        options: [:]
      )
      try handler.perform([request])

      let faces: [[String: Double]] = (request.results ?? []).map { f in
        let bb = f.boundingBox // normalized, origin bottom-left
        return [
          "x": bb.minX * w,
          "y": (1 - bb.maxY) * h, // convert to top-left origin
          "width": bb.width * w,
          "height": bb.height * h,
        ]
      }
      return ["width": w, "height": h, "faces": faces]
    }
  }
}