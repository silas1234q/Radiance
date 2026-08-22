/**
 * Legal copy for the public site.
 *
 * Ported from the app's `frontend/src/components/legal/LegalModal.tsx`, which
 * renders the same documents in-app. Keep the two in sync when either changes —
 * App Store review compares the hosted policy against what the app shows.
 *
 * The Terms of Use double as our Custom EULA and mirror Apple's Licensed
 * Application End User License Agreement ("Standard EULA") clause for clause.
 * Sections 9-24 are the EULA proper: don't drop or soften them without
 * re-reading https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
 */

export const SUPPORT_EMAIL = 'sarfosilas2003@gmail.com'

export const LAST_UPDATED = 'August 2026'

export type LegalSection = {
  title: string
  body: string[]
}

export type LegalDocument = {
  slug: string
  title: string
  /** Sits under the page title, and used as the meta description. */
  summary: string
  intro: string[]
  sections: LegalSection[]
}

export const privacyPolicy: LegalDocument = {
  slug: 'privacy',
  title: 'Privacy Policy',
  summary: 'How Radiance collects, uses, and safeguards your personal data.',
  intro: [
    'Radiance ("we", "us", or "our") respects your privacy and is committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Radiance mobile application and this website.',
  ],
  sections: [
    {
      title: 'Information We Collect',
      body: [
        'Account information: When you create an account, we collect your name, email address, and authentication credentials via our authentication provider (Clerk).',
        'Skin data: We collect the information you provide through our skin quiz (skin type, concerns, sensitivities) and, if you opt in to a face scan, a photograph of your face. Face data is covered in detail in the Face Data section below.',
        'Usage data: We collect information about how you interact with the app, including routine completions, mood logs, and skin log entries, to personalise your experience and track your progress.',
      ],
    },
    {
      title: 'How We Use Your Information',
      body: [
        'We use your information to provide personalised skin analysis and routine recommendations, track your skin health progress over time, send you reminders and notifications (with your permission), improve our AI-powered analysis and recommendations, and process subscriptions and purchases.',
      ],
    },
    {
      title: 'Face Data',
      body: [
        'What we collect: if you choose to do a face scan, Radiance captures a single still photograph of your face, taken only at the moment you tap the capture button. We do not record video and we do not access your camera in the background. The face scan is optional — if you skip it, Radiance analyses your quiz answers alone.',
        'On-device quality check: before a photo is accepted, an on-device face detector confirms it shows one well-lit, centred, front-facing face. It measures only where your face sits in the frame, the angle of your head, and whether your eyes are open. These measurements never leave your device and are discarded immediately. Radiance does not create a faceprint, face template, face embedding, or any other biometric identifier, and never uses face data to identify, recognise, or authenticate you.',
        'How we use it: your photo is used solely to generate your own skin metrics and score, and to show you a before-and-after comparison of your own progress. We never use face data for advertising, never use it to train AI models, never share it with other users, and never sell it.',
        'Where it is stored and who receives it: the photo is sent over an encrypted connection to our authenticated backend and stored by Cloudinary, our image storage provider. It is then sent to Perfect Corp (the YouCam Skin Analysis API) for the sole purpose of computing your skin metrics, which are returned to us as numbers. Both act as processors on our instructions. No one else receives the image — in particular, your photo is never sent to OpenAI, which receives only the resulting numeric scores and your quiz answers as text. No face data is sent to our analytics or subscription providers. The photo is never saved to your device\'s photo library, and the temporary capture file is deleted from your device once the upload completes.',
        'How long we keep it: we retain your first scan (your "before" photo) and your most recent scan. When a newer scan replaces an older one, the superseded photo is deleted automatically. Both are kept only for as long as your account exists.',
        'Deleting it: deleting your account from the Profile screen permanently removes your photos from our database and from Cloudinary storage. You can also email ' +
          SUPPORT_EMAIL +
          ' at any time to request deletion of your face data.',
      ],
    },
    {
      title: 'Third-Party Services',
      body: [
        'We use the following third-party services: Clerk for authentication, Cloudinary for secure photo storage, Perfect Corp (YouCam) for face-scan skin analysis, OpenAI for AI-powered recommendations, RevenueCat for subscription management, Expo for push notifications, and PostHog for product analytics. Each service processes data in accordance with their own privacy policies. Of these, only Cloudinary and Perfect Corp ever receive your face photo — see the Face Data section above.',
        'Product information shown in the app is sourced in part from Open Beauty Facts, an open database of cosmetic products. We do not share your personal data with Open Beauty Facts.',
      ],
    },
    {
      title: 'Analytics & This Website',
      body: [
        'We use PostHog to understand how the app and this website are used, so we can improve them. This includes pages and screens viewed and features used. In the app, analytics events are associated with your account identifier only — never your email address or your photos.',
        'We do not sell your personal data, and we do not use your data for cross-app or cross-site advertising tracking.',
      ],
    },
    {
      title: 'Data Retention & Deletion',
      body: [
        'You can delete your account and all associated data at any time from the Profile screen in the app. When you delete your account, all your personal data, skin profiles, logs, and routines are permanently removed from our database, and your face-scan and skin-log photos are permanently deleted from our image storage provider.',
      ],
    },
    {
      title: 'Security',
      body: [
        'We implement industry-standard security measures including encrypted data transmission (TLS), secure token-based authentication, and access controls to protect your personal information.',
      ],
    },
    {
      title: "Children's Privacy",
      body: [
        'Radiance is not intended for children under 13, and we do not knowingly collect personal data from them. If you believe a child has provided us with personal data, contact us at ' +
          SUPPORT_EMAIL +
          ' and we will delete it.',
      ],
    },
    {
      title: 'Contact Us',
      body: [
        'If you have any questions about this Privacy Policy, or would like to request access to or deletion of your data, contact us at ' +
          SUPPORT_EMAIL +
          '.',
      ],
    },
  ],
}

export const termsOfUse: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Use',
  summary:
    'The terms you agree to when using Radiance, including the end user licence agreement for the app.',
  intro: [
    'Welcome to Radiance. By using our mobile application, you agree to be bound by these Terms of Use. Please read them carefully before using the app.',
    'Radiance is licensed, not sold, to you. Sections 9 to 24 form the end user licence agreement for the app and follow Apple\'s Licensed Application End User License Agreement. In them, "Licensor" means us, the Application Provider of Radiance. We reserve all rights in and to Radiance not expressly granted to you under these Terms.',
  ],
  sections: [
    {
      title: 'Acceptance of Terms',
      body: [
        'By accessing or using Radiance, you agree to these Terms of Use and our Privacy Policy. If you do not agree, please do not use the app.',
      ],
    },
    {
      title: 'Description of Service',
      body: [
        'Radiance is an AI-powered skincare application that provides personalised skin analysis, routine recommendations, and progress tracking. Our analysis is for informational purposes only and does not constitute medical advice.',
      ],
    },
    {
      title: 'Not Medical Advice',
      body: [
        'Radiance is not a medical device and does not provide medical diagnoses or treatment recommendations. The skin analysis, scores, and routine suggestions are generated by AI and should not replace professional dermatological advice. Always consult a qualified healthcare provider for skin conditions or concerns.',
      ],
    },
    {
      title: 'Eligibility',
      body: [
        'You must be at least 13 years old to use Radiance. If you are under the age of majority where you live, you may only use Radiance with the involvement of a parent or guardian who agrees to these Terms on your behalf.',
      ],
    },
    {
      title: 'Accounts',
      body: [
        'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating your account and keep it up to date.',
      ],
    },
    {
      title: 'Subscriptions & Purchases',
      body: [
        'Some features require a Radiance Pro subscription. Subscriptions are billed through the Apple App Store or Google Play Store and are subject to their respective terms. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing period. You can manage and cancel subscriptions in your device settings.',
        'Payment is charged to your App Store or Google Play account at confirmation of purchase. Any unused portion of a free trial period is forfeited when you purchase a subscription. Refunds are handled by Apple or Google under their own policies — we are not able to issue refunds for store purchases directly.',
      ],
    },
    {
      title: 'User Content',
      body: [
        'You retain ownership of the photos and data you submit to Radiance. By uploading content, you grant us a limited licence to process and store it for the purpose of providing our services to you.',
      ],
    },
    {
      title: 'Prohibited Uses',
      body: [
        'You agree not to use Radiance to violate any laws, upload harmful or inappropriate content, attempt to gain unauthorised access to our systems, or use the app in any way that could damage or impair its functionality.',
      ],
    },
    {
      title: 'Acknowledgement',
      body: [
        'You and we acknowledge that these Terms are concluded between you and us only, and not with Apple Inc. ("Apple"), and that we, not Apple, are solely responsible for Radiance and its content. These Terms do not provide for usage rules for Radiance that conflict with the Apple Media Services Terms and Conditions ("Usage Rules").',
        'Where Radiance is obtained through Google Play, it is licensed to you subject to the Google Play Terms of Service, and Google is likewise not a party to these Terms.',
      ],
    },
    {
      title: 'Scope of Licence',
      body: [
        'Licensor grants to you a nontransferable licence to use Radiance on any Apple-branded products that you own or control and as permitted by the Usage Rules. These Terms will govern any content, materials, or services accessible from or purchased within Radiance, as well as upgrades provided by Licensor that replace or supplement the original app, unless such upgrade is accompanied by a separate licence agreement.',
        'Except as provided in the Usage Rules, you may not distribute or make Radiance available over a network where it could be used by multiple devices at the same time. You may not transfer, redistribute, or sublicense Radiance and, if you sell your Apple device to a third party, you must remove Radiance from the device before doing so.',
        'You may not copy (except as permitted by this licence and the Usage Rules), reverse-engineer, disassemble, attempt to derive the source code of, modify, or create derivative works of Radiance, any updates, or any part thereof, except as and only to the extent that any of the foregoing restrictions is prohibited by applicable law, or to the extent permitted by the licensing terms governing use of any open-sourced components included with Radiance.',
      ],
    },
    {
      title: 'Consent to Use of Data',
      body: [
        'You agree that Licensor may collect and use technical data and related information — including but not limited to technical information about your device, system and application software, and peripherals — that is gathered periodically to facilitate the provision of software updates, product support, and other services to you (if any) related to Radiance. Licensor may use this information, as long as it is in a form that does not personally identify you, to improve its products or to provide services or technologies to you.',
        'Our handling of personal data, including your photos and skin data, is described separately in our Privacy Policy.',
      ],
    },
    {
      title: 'Termination',
      body: [
        'This licence is effective until terminated by you or Licensor. Your rights under it will terminate automatically if you fail to comply with any of its terms.',
        'You may stop using Radiance and delete your account at any time from the Profile screen in the app. We may suspend or terminate your access if you breach these Terms or use the app in a way that harms other users or our systems.',
      ],
    },
    {
      title: 'External Services',
      body: [
        'Radiance may enable access to Licensor\'s and/or third-party services and websites (collectively and individually, "External Services"). You agree to use the External Services at your sole risk. Licensor is not responsible for examining or evaluating the content or accuracy of any third-party External Services, and shall not be liable for any such third-party External Services.',
        'Data displayed by Radiance or any External Service, including but not limited to medical, health, and product information, is for general informational purposes only and is not guaranteed by Licensor or its agents. You will not use the External Services in any manner that is inconsistent with these Terms or that infringes the intellectual property rights of Licensor or any third party. You agree not to use the External Services to harass, abuse, stalk, threaten, or defame any person or entity, and that Licensor is not responsible for any such use.',
        'External Services may not be available in all languages or in your home country, and may not be appropriate or available for use in any particular location. To the extent you choose to use such External Services, you are solely responsible for compliance with any applicable laws. Licensor reserves the right to change, suspend, remove, disable, or impose access restrictions or limits on any External Services at any time without notice or liability to you.',
      ],
    },
    {
      title: 'No Warranty',
      body: [
        'YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF RADIANCE IS AT YOUR SOLE RISK. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, RADIANCE AND ANY SERVICES PERFORMED OR PROVIDED BY IT ARE PROVIDED "AS IS" AND "AS AVAILABLE", WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND, AND LICENSOR HEREBY DISCLAIMS ALL WARRANTIES AND CONDITIONS WITH RESPECT TO RADIANCE AND ANY SERVICES, EITHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES AND/OR CONDITIONS OF MERCHANTABILITY, OF SATISFACTORY QUALITY, OF FITNESS FOR A PARTICULAR PURPOSE, OF ACCURACY, OF QUIET ENJOYMENT, AND OF NONINFRINGEMENT OF THIRD-PARTY RIGHTS.',
        'NO ORAL OR WRITTEN INFORMATION OR ADVICE GIVEN BY LICENSOR OR ITS AUTHORISED REPRESENTATIVE SHALL CREATE A WARRANTY. SHOULD RADIANCE OR ITS SERVICES PROVE DEFECTIVE, YOU ASSUME THE ENTIRE COST OF ALL NECESSARY SERVICING, REPAIR, OR CORRECTION. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES OR LIMITATIONS ON APPLICABLE STATUTORY RIGHTS OF A CONSUMER, SO THE ABOVE EXCLUSION AND LIMITATIONS MAY NOT APPLY TO YOU.',
      ],
    },
    {
      title: 'Limitation of Liability',
      body: [
        'TO THE EXTENT NOT PROHIBITED BY LAW, IN NO EVENT SHALL LICENSOR BE LIABLE FOR PERSONAL INJURY OR ANY INCIDENTAL, SPECIAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER, INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR ANY OTHER COMMERCIAL DAMAGES OR LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE RADIANCE, HOWEVER CAUSED, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, OR OTHERWISE) AND EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
        'SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OF LIABILITY FOR PERSONAL INJURY, OR OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THIS LIMITATION MAY NOT APPLY TO YOU. In no event shall Licensor\'s total liability to you for all damages (other than as may be required by applicable law in cases involving personal injury) exceed the amount of fifty dollars ($50.00). The foregoing limitations will apply even if the above stated remedy fails of its essential purpose.',
        'This includes, without limitation, any skin reaction or other outcome arising from following routine or product recommendations generated by Radiance. Use the app at your own discretion.',
      ],
    },
    {
      title: 'Maintenance & Support',
      body: [
        'We are solely responsible for providing any maintenance and support services for Radiance, as specified in these Terms or as required under applicable law. You and we acknowledge that Apple has no obligation whatsoever to furnish any maintenance and support services for Radiance. You can reach us for support at ' +
          SUPPORT_EMAIL +
          '.',
      ],
    },
    {
      title: 'Warranty Failure & Refunds',
      body: [
        'We are solely responsible for any product warranties, whether express or implied by law, to the extent they have not been effectively disclaimed. In the event of any failure of Radiance to conform to an applicable warranty, you may notify Apple, and Apple will refund the purchase price (if any) of the app to you.',
        'To the maximum extent permitted by applicable law, Apple will have no other warranty obligation whatsoever with respect to Radiance, and any other claims, losses, liabilities, damages, costs, or expenses attributable to any failure to conform to any warranty will be our sole responsibility.',
      ],
    },
    {
      title: 'Product Claims',
      body: [
        'We, not Apple, are responsible for addressing any claims by you or any third party relating to Radiance or your possession and use of it, including: (i) product liability claims; (ii) any claim that Radiance fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection, privacy, or similar legislation, including in connection with Radiance\'s use of health-related data. Nothing in these Terms limits our liability to you beyond what is permitted by applicable law.',
      ],
    },
    {
      title: 'Intellectual Property Rights',
      body: [
        'In the event of any third party claim that Radiance, or your possession and use of it, infringes that third party\'s intellectual property rights, we, not Apple, will be solely responsible for the investigation, defence, settlement, and discharge of any such claim.',
      ],
    },
    {
      title: 'Export Compliance',
      body: [
        'You may not use or otherwise export or re-export Radiance except as authorised by United States law and the laws of the jurisdiction in which Radiance was obtained. In particular, but without limitation, Radiance may not be exported or re-exported (a) into any U.S.-embargoed countries or (b) to anyone on the U.S. Treasury Department\'s Specially Designated Nationals List or the U.S. Department of Commerce Denied Persons List or Entity List.',
        'By using Radiance, you represent and warrant that you are not located in any such country or on any such list, and that you are not located in a country that has been designated by the U.S. Government as a "terrorist supporting" country. You also agree that you will not use Radiance for any purposes prohibited by United States law, including, without limitation, the development, design, manufacture, or production of nuclear, missile, or chemical or biological weapons.',
      ],
    },
    {
      title: 'U.S. Government End Users',
      body: [
        'Radiance and related documentation are "Commercial Items", as that term is defined at 48 C.F.R. §2.101, consisting of "Commercial Computer Software" and "Commercial Computer Software Documentation", as such terms are used in 48 C.F.R. §12.212 or 48 C.F.R. §227.7202, as applicable. Consistent with 48 C.F.R. §12.212 or 48 C.F.R. §227.7202-1 through 227.7202-4, as applicable, the Commercial Computer Software and Commercial Computer Software Documentation are being licensed to U.S. Government end users (a) only as Commercial Items and (b) with only those rights as are granted to all other end users pursuant to the terms and conditions herein. Unpublished-rights reserved under the copyright laws of the United States.',
      ],
    },
    {
      title: 'Governing Law',
      body: [
        'Except to the extent expressly provided in the following paragraph, these Terms and the relationship between you and Apple shall be governed by the laws of the State of California, excluding its conflicts of law provisions. You and Apple agree to submit to the personal and exclusive jurisdiction of the courts located within the county of Santa Clara, California, to resolve any dispute or claim arising from these Terms.',
        'If (a) you are not a U.S. citizen; (b) you do not reside in the U.S.; (c) you are not accessing the service from the U.S.; and (d) you are a citizen of any European Union country, or of Switzerland, Norway, or Iceland, then the governing law and forum shall be the laws and courts of your usual place of residence, without regard to any conflict of law provisions, and you hereby irrevocably submit to the non-exclusive jurisdiction of those courts.',
        'Specifically excluded from application to these Terms is the law known as the United Nations Convention on the International Sale of Goods.',
      ],
    },
    {
      title: 'Third Party Terms',
      body: [
        'You must comply with any applicable third party terms of agreement when using Radiance — for example, the terms of your wireless data provider, and the terms of the app store through which you obtained the app.',
      ],
    },
    {
      title: 'Third Party Beneficiary',
      body: [
        'You and we acknowledge and agree that Apple, and Apple\'s subsidiaries, are third party beneficiaries of these Terms, and that upon your acceptance of these Terms, Apple will have the right (and will be deemed to have accepted the right) to enforce these Terms against you as a third party beneficiary.',
      ],
    },
    {
      title: 'Changes to Terms',
      body: [
        'We may update these Terms of Use from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.',
      ],
    },
    {
      title: 'Contact Us',
      body: [
        'Radiance is developed and provided by an independent individual developer. If you have any questions, complaints, or claims regarding Radiance or these Terms, contact us at ' +
          SUPPORT_EMAIL +
          ' and we will respond as soon as we can.',
      ],
    },
  ],
}
