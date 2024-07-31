import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import logo from "public/logo/squeakLogo.svg";

function Privacy() {
  return (
    <motion.div
      key={"privacy"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="baseVertFlex min-h-[100dvh] !justify-start px-2 pb-16 tablet:pt-16"
    >
      <div className="baseVertFlex mx-auto mb-32 mt-8 max-w-2xl !items-start rounded-md border-2 border-lightGreen bg-gradient-to-br from-green-800 to-green-850 p-6 text-white tablet:mb-24">
        <Image
          src={logo}
          alt="Squeak logo"
          priority={true}
          className="h-48 w-48 !self-center"
        />

        <h1 className="mb-6 text-2xl font-bold tablet:text-3xl">
          Privacy Policy
        </h1>
        <p className="mb-4">
          <span className="font-semibold">Effective Date:</span> August 1st,
          2024
        </p>

        <p className="mb-4">
          Squeak (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is
          committed to protecting your privacy. This Privacy Policy explains how
          we collect, use, disclose, and safeguard your information when you
          visit our website
          <Button variant="link" className="h-6 !px-1" asChild>
            <Link href="/">playsqueak.com</Link>
          </Button>
          , use our services, and interact with our platform. Please read this
          policy carefully to understand our practices regarding your personal
          information.
        </p>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          1. Information We Collect
        </h2>
        <p className="mb-4">
          We collect the following information from you when you use our website
          or services:
        </p>
        <ul className="baseVertFlex mb-4 list-inside list-disc !items-start gap-2">
          <li>
            <span className="font-semibold">Personal Information:</span> When
            you create an account, we may collect personal information,
            including your first and last name, phone number, and email address.
          </li>
          <li>
            <span className="font-semibold">Cookies:</span> Clerk, our
            authentication provider, uses cookies to manage user sessions. You
            can manage cookie preferences through your browser settings.
          </li>
        </ul>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          2. How We Use Your Information
        </h2>
        <p className="mb-4">
          We use the information we collect for the following purposes:
        </p>
        <ul className="baseVertFlex mb-4 list-inside list-disc !items-start gap-2">
          <li>
            To provide and maintain our services, including managing your
            account.
          </li>
          <li>To communicate with you about your account and other updates.</li>
          <li>To personalize your experience and improve our services.</li>
          <li>To analyze usage patterns and improve website performance.</li>
          <li>To comply with legal obligations and enforce our terms.</li>
        </ul>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          3. How We Share Your Information
        </h2>
        <p className="mb-4">
          We do not sell your personal information. We may share your
          information with third parties in the following circumstances:
        </p>
        <ul className="baseVertFlex mb-4 list-inside list-disc !items-start gap-2">
          <li>
            <span className="font-semibold">Service Providers:</span> We use
            third-party services such as Clerk for authentication. These service
            providers have their own privacy policies and terms of use.
          </li>
          <li>
            <span className="font-semibold">Legal Requirements:</span> We may
            disclose your information if required to do so by law or in response
            to valid requests by public authorities.
          </li>
        </ul>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          4. Data Retention
        </h2>
        <p className="mb-4">
          We retain your personal information for as long as your account is
          active or as needed to provide you with our services. If you delete
          your account, we will delete or anonymize your personal information
          across our services (including but not limited to Clerk and our
          database).
        </p>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          5. Data Security
        </h2>
        <p className="mb-4">
          We implement appropriate security measures to protect your personal
          information. Our security practices include encryption, access
          controls, and regular security assessments. However, no method of
          transmission over the internet or electronic storage is 100% secure.
          While we strive to use commercially acceptable means to protect your
          information, we cannot guarantee its absolute security.
        </p>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          6. International Users
        </h2>
        <p className="mb-4">
          Our website is intended for use only within the United States. Access
          to our website from outside the United States is restricted and not
          permitted. By using our services, you agree to comply with this
          limitation.
        </p>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          7. User Rights
        </h2>
        <p className="mb-4">
          You have the right to access, rectify, delete, and restrict the
          processing of your personal data. To exercise these rights, please
          contact us at
          <Button variant="link" className="h-6 !px-1" asChild>
            <a href="mailto:michael.ongaro.dev@gmail.com">
              michael.ongaro.dev@gmail.com
            </a>
          </Button>
          . We will respond to your request within a reasonable timeframe.
        </p>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          8. Changes to This Privacy Policy
        </h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. If we make
          significant changes, we will notify you via email. Your continued use
          of our website and services after any changes indicates your
          acceptance of the new terms.
        </p>

        <h2 className="mb-4 text-xl font-semibold tablet:text-2xl">
          9. Contact Us
        </h2>
        <p className="mb-4">
          If you have any questions or concerns about this Privacy Policy,
          please contact us at:
        </p>
        <p className="baseVertFlex mb-4 w-full !items-start">
          <span className="font-medium underline underline-offset-2">
            Squeak
          </span>
          <div className="baseFlex gap-2">
            Email address:
            <Button variant="link" className="h-6 !px-1" asChild>
              <a href="mailto:michael.ongaro.dev@gmail.com">
                michael.ongaro.dev@gmail.com
              </a>
            </Button>
          </div>
        </p>
      </div>
    </motion.div>
  );
}

export default Privacy;
