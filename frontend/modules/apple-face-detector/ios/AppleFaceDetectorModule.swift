import ExpoModulesCore
import Vision
import UIKit
import ImageIO

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
    return ["width": 0, "height": 0, "faces": [] as [[String: Double]]]
  }

  let w = Double(image.size.width * image.scale)
  let h = Double(image.size.height * image.scale)

  let request = VNDetectFaceRectanglesRequest()
  let handler = VNImageRequestHandler(
    cgImage: cg,
    orientation: CGImagePropertyOrientation(image.imageOrientation),
    options: [:]
  )

  do {
    try handler.perform([request])
  } catch {
    return ["width": w, "height": h, "faces": [] as [[String: Double]]]
  }

  let faces: [[String: Double]] = (request.results ?? []).map { f in
    let bb = f.boundingBox
    return [
      "x": Double(bb.minX) * w,
      "y": (1.0 - Double(bb.maxY)) * h,
      "width": Double(bb.width) * w,
      "height": Double(bb.height) * h,
    ]
  }
  return ["width": w, "height": h, "faces": faces]
}
  }
}