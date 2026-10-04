Pod::Spec.new do |s|
  s.name             = 'AppleFaceDetector'
  s.version          = '1.0.0'
  s.summary          = 'Face detection using Apple Vision'
  s.description      = 'Face detection using Apple Vision'
  s.author           = ''
  s.homepage         = 'https://docs.expo.dev/modules/'
  s.license          = { :type => 'MIT' }
  s.platforms        = { :ios => '16.0' }
  s.source           = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end