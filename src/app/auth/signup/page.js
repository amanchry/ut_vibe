"use client";
import { Box, Button, Flex, Text, TextField } from "@radix-ui/themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import OtpInput from "@/components/OtpInput";
import { signIn } from "next-auth/react";

import { useToast } from "@/provider/ToastContext";


function Signup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otpError, setOtpError] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { showToast } = useToast();

  useEffect(() => {
    let timer;
    if (isResendDisabled && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
    }

    return () => clearTimeout(timer);
  }, [countdown, isResendDisabled]);

  // function to handle resending the code
  const handleResendCode = () => {
    // Reset the countdown and disable the button
    setCountdown(10);
    setIsResendDisabled(true);

    // Call your function to resend the OTP
    handleSendOtp({ email: userEmail });
  };

  const {
    register,
    handleSubmit,
    setValue, // Add this
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });



    const handleSendOtp = async (data) => {
    setIsLoading(true);
    try {
      // Generate OTP on frontend
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Send email with OTP
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          otp: otp,
        }),
      });

      const responseData = await response.json();
      if (responseData.success) {
        setUserEmail(data.email);
        setShowOtpField(true);
      } else {
        showToast("Failed to send verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };





  const handleVerifyOtp = (data) => {
    setIsLoading(true);
    setOtpError("");

    try {
      // Verify OTP locally
      if (String(data.otp) === String(generatedOtp)) {
        // OTP is correct, proceed to password creation
        setShowPasswordField(true);
      } else {
        // OTP is incorrect
        setOtpError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setOtpError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

const handleRegister = async (data) => {
  if (data.password !== data.confirmPassword) {
    showToast("Passwords do not match");
    return;
  }

  setIsLoading(true);
  try {
    // ✅ Call your internal API route with fetch
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    const result = await res.json();

    if (res.ok && result.success) {
      // Optional OTP step
      setUserEmail(data.email);
      setShowOtpField(true);

      // ✅ Automatically log in the user
      await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      router.push("/");
    } else {
      showToast(result.message || "Registration failed");
    }
  } catch (err) {
    console.error("Registration error:", err);
    showToast("Something went wrong while registering");
  } finally {
    setIsLoading(false);
  }
};

  const onSubmit = (data) => {
    if (!showOtpField) {
      handleSendOtp(data);
    } else if (!showPasswordField) {
      handleVerifyOtp(data);
    } else {
      handleRegister(data);
    }
  };

  return (
    <>
      {!showOtpField ? (
        <Flex
          maxWidth="480px"
          direction="column"
          align="center"
          justify="center"
          className="mx-auto min-h-screen p-4 sm:p-5 md:p-6 bg-[#FCFCFD] w-full"
          gap="6 sm:gap-8"
        >
          <Box className="w-full">
            <Image
              src="/images/Logo.png"
              alt="Logo"
              width={174}
              height={75}
               className="mx-auto mb-6 sm:mb-8 w-auto h-auto max-w-[140px] sm:max-w-[174px]"
            />
   
              {/* <Text as="p" align="center" size="8" weight="medium">
                Create new UT Vibe Account
              </Text> */}
              <Text
                as="p"
                color="gray"
               size={{ initial: "2", sm: "3" }}
                align="center"
                className="my-6 sm:my-8 md:my-10 px-2"
                weight="light"
              >
                Join the campus vibe! Share what's happening right now, find events, meetups, and all the good stuff happening around you
              </Text>

          </Box>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Flex direction="column" gap="5 sm:gap-6" width="100%">
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="1">
                  Email
                </Text>
                <Box className="w-full">
                  <TextField.Root
                    size={{ initial: "2", sm: "2" }}
                    placeholder="Enter email address"
                    variant={errors.email ? "soft" : "surface"}
                    className={`${errors.email
                      ? "!bg-[#FBECEC] focus-within:!outline-[#DC4242] !border-0"
                      : "focus-within:!outline-[#3F7FC0] focus-within:!bg-transparent !border-0"
                      } !bg-transparent border !border-[#D2D2D2] mb-1 w-full`}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Please enter the email id in correct format",
                      },
                    })}
                  />
                  <Flex height="20px" justify="start" align="center">
                    {errors.email && (
                      <Text className="text-[#DC4242] text-xs sm:text-sm font-normal">
                        {errors.email.message}
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
              <Button
                type="submit"
                variant="solid"
                size={{ initial: "3", sm: "3" }}
                disabled={!isValid || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Sending code...
                  </span>
                ) : (
                  "Let's go!"
                )}
              </Button>
            </Flex>
          </form>
          <Flex gap="2" align="center" direction={{ initial: "column", sm: "row" }} className="w-full sm:w-auto">
            <Box>
              <Text as="p" size={{ initial: "1", sm: "2" }} weight="medium" color="gray" className="font-dm-sans text-xs sm:text-[12px]">
                Already vibing with us?
              </Text>
            </Box>
            <Box>
              <Button
                variant="ghost"
                size={{ initial: "2", sm: "3" }}
                className="font-dm-sans text-xs sm:text-[12px] !underline !underline-offset-2"
                onClick={() => router.push("/auth/login")}
              >
                Sign in instead
              </Button>
            </Box>
          </Flex>
        </Flex>
      ) : !showPasswordField ? (
        <Flex
          direction="column"
          align="start"
          justify="start"
          gap="4"
          maxWidth="480px"
          className="mx-auto p-4 sm:p-5 md:p-6 w-full min-h-screen"
        >
          <Button
            variant="ghost"
            size={{ initial: "2", sm: "2" }}
            color="gray"
            onClick={() => setShowOtpField(false)}
            className="mb-2"
          >
            <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Flex
            width="100%"
            direction="column"
            align="start"
            justify="center"
            className="mx-auto"
            gap="6 sm:gap-8"
          >
            <Flex direction="column" width="100%" gap="2" align="start">
              <Text as="p" size={{ initial: "5", sm: "7" }} weight="regular">
                Enter verification code
              </Text>
              <Text
                as="p"
                color="gray"
                size={{ initial: "2", sm: "3" }}
                className="my-4 sm:my-6 md:my-10"
                weight="light"
              >
                We just sent a code to
              </Text>
              <Text as="p" size={{ initial: "2", sm: "3" }} weight="regular" color="blue" className="break-all">
                {userEmail}
              </Text>
            </Flex>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full">
              <Flex direction="column" gap="5 sm:gap-6" width="100%">
                <Flex direction="column" gap="2">
                  <Text as="div" size="1" weight="medium" color="gray" pb="2">
                    Enter the 6-digit code
                  </Text>
                  <OtpInput
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    otpError={otpError}
                  />

                  <Flex height="20px" justify="start" align="center" className="min-h-[20px]">
                    {errors.otp && errors.otp.type !== "required" && (
                      <Text color="red" size={{ initial: "1", sm: "2" }} className="text-xs sm:text-sm">
                        {errors.otp.message}
                      </Text>
                    )}
                    {otpError && !errors.otp && (
                      <Text color="red" size={{ initial: "1", sm: "2" }} className="text-xs sm:text-sm">
                        {otpError}
                      </Text>
                    )}
                  </Flex>
                </Flex>
                <Button
                  type="submit"
                  variant="solid"
                  size={{ initial: "3", sm: "3" }}
                  disabled={!isValid || isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? "Checking..." : "Verify ✨"}
                </Button>
              </Flex>
            </form>
            <Flex gap="2" direction={{ initial: "column", sm: "row" }} align={{ initial: "start", sm: "center" }} className="w-full">
              <Box>
                <Text as="p" size={{ initial: "1", sm: "2" }} weight="medium" color="gray" className="text-xs sm:text-sm">
                  Didn&apos;t receive an email?
                </Text>
              </Box>
              <Box>
                <Button
                  variant="ghost"
                  size={{ initial: "1", sm: "2" }}
                  onClick={handleResendCode}
                  disabled={isResendDisabled}
                  className="text-xs sm:text-sm"
                >
                  {isResendDisabled
                    ? `Resend code in ${countdown}s`
                    : "Resend code"}
                </Button>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <Flex
          maxWidth="480px"
          direction="column"
          align="start"
          justify="center"
          className="mx-auto p-4 sm:p-5 md:p-6 w-full min-h-screen"
          gap="6 sm:gap-8"
        >
          <Flex direction="column" width="100%" gap="2" align="start">
            <Text as="p" size={{ initial: "5", sm: "7" }} weight="regular">
              Almost there! 🔐
            </Text>
            <Text as="p" color="gray" size={{ initial: "2", sm: "3" }} className="my-4 sm:my-6 md:my-10" weight="light">
              Create a strong password (at least 8 characters with a special character)
            </Text>

          </Flex>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col gap-6 sm:gap-8"
          >
            <Flex direction="column" gap="4 sm:gap-5" width="100%">

              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="1">
                  Email
                </Text>
                <TextField.Root
                  size={{ initial: "2", sm: "2" }}
                  placeholder="Enter Email"
                  type='email'
                  value={userEmail}
                  disabled
                  className="w-full"
                >

                </TextField.Root>

              </Flex>
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="1">
                  Name
                </Text>
                <TextField.Root
                  size={{ initial: "2", sm: "2" }}
                  placeholder="Your name"
                  type='text'
                  className="w-full"
                  {...register("name", {
                    required: "Username is required",
                  })}
                >

                </TextField.Root>

              </Flex>


              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="1">
                  Password
                </Text>
                <TextField.Root
                  size={{ initial: "2", sm: "2" }}
                  placeholder="Create a password"
                  variant={errors.password ? "soft" : "surface"}
                  color={errors.password ? "red" : undefined}
                  type={showPassword ? "text" : "password"}
                  className="w-full"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                >
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-gray-100 rounded flex items-center touch-manipulation"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M19.3211 9.74688C19.2937 9.68516 18.632 8.21719 17.1609 6.74609C15.2008 4.78594 12.725 3.75 9.99999 3.75C7.27499 3.75 4.79921 4.78594 2.83905 6.74609C1.36796 8.21719 0.703118 9.6875 0.678899 9.74688C0.643362 9.82681 0.625 9.91331 0.625 10.0008C0.625 10.0883 0.643362 10.1748 0.678899 10.2547C0.706243 10.3164 1.36796 11.7836 2.83905 13.2547C4.79921 15.2141 7.27499 16.25 9.99999 16.25C12.725 16.25 15.2008 15.2141 17.1609 13.2547C18.632 11.7836 19.2937 10.3164 19.3211 10.2547C19.3566 10.1748 19.375 10.0883 19.375 10.0008C19.375 9.91331 19.3566 9.82681 19.3211 9.74688ZM9.99999 15C7.5953 15 5.49452 14.1258 3.75546 12.4023C3.0419 11.6927 2.43483 10.8836 1.95312 10C2.4347 9.11636 3.04179 8.30717 3.75546 7.59766C5.49452 5.87422 7.5953 5 9.99999 5C12.4047 5 14.5055 5.87422 16.2445 7.59766C16.9595 8.307 17.5679 9.11619 18.0508 10C17.4875 11.0516 15.0336 15 9.99999 15ZM9.99999 6.25C9.25831 6.25 8.53329 6.46993 7.9166 6.88199C7.29992 7.29404 6.81927 7.87971 6.53544 8.56494C6.25162 9.25016 6.17735 10.0042 6.32205 10.7316C6.46674 11.459 6.82389 12.1272 7.34834 12.6517C7.87279 13.1761 8.54097 13.5333 9.2684 13.6779C9.99583 13.8226 10.7498 13.7484 11.4351 13.4645C12.1203 13.1807 12.7059 12.7001 13.118 12.0834C13.5301 11.4667 13.75 10.7417 13.75 10C13.749 9.00576 13.3535 8.05253 12.6505 7.34949C11.9475 6.64645 10.9942 6.25103 9.99999 6.25ZM9.99999 12.5C9.50554 12.5 9.02219 12.3534 8.61107 12.0787C8.19994 11.804 7.87951 11.4135 7.69029 10.9567C7.50107 10.4999 7.45157 9.99723 7.54803 9.51227C7.64449 9.02732 7.88259 8.58186 8.23222 8.23223C8.58186 7.8826 9.02731 7.6445 9.51227 7.54804C9.99722 7.45157 10.4999 7.50108 10.9567 7.6903C11.4135 7.87952 11.804 8.19995 12.0787 8.61107C12.3534 9.0222 12.5 9.50555 12.5 10C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 9.99999 12.5Z" fill="#1C2024" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22" fill="none">
                          <path d="M17.811 15.5047C17.7396 15.5454 17.6609 15.5716 17.5794 15.5819C17.4978 15.5921 17.4151 15.5862 17.3358 15.5644C17.2566 15.5427 17.1824 15.5055 17.1176 15.455C17.0527 15.4045 16.9984 15.3418 16.9579 15.2703L15.4735 12.6766C14.6105 13.2601 13.6586 13.6996 12.6547 13.9781L13.1133 16.7297C13.1269 16.8107 13.1243 16.8936 13.1058 16.9736C13.0873 17.0536 13.0532 17.1292 13.0054 17.196C12.9577 17.2628 12.8972 17.3196 12.8276 17.363C12.7579 17.4065 12.6803 17.4358 12.5993 17.4492C12.566 17.4547 12.5323 17.4576 12.4985 17.4578C12.3506 17.4576 12.2076 17.405 12.0949 17.3093C11.9822 17.2136 11.9071 17.081 11.8829 16.9352L11.4321 14.2336C10.4815 14.3659 9.51709 14.3659 8.56646 14.2336L8.11568 16.9352C8.09143 17.0813 8.01606 17.2141 7.90302 17.3098C7.78998 17.4055 7.64662 17.458 7.4985 17.4578C7.46395 17.4577 7.42947 17.4548 7.39537 17.4492C7.31435 17.4358 7.23678 17.4065 7.16709 17.363C7.0974 17.3196 7.03696 17.2628 6.98922 17.196C6.94148 17.1292 6.90738 17.0536 6.88886 16.9736C6.87034 16.8936 6.86778 16.8107 6.88131 16.7297L7.34225 13.9781C6.33883 13.6988 5.3874 13.2584 4.52506 12.6742L3.04537 15.2703C2.96249 15.4147 2.82563 15.5203 2.66491 15.5638C2.50419 15.6073 2.33276 15.5852 2.18834 15.5024C2.04392 15.4195 1.93834 15.2826 1.89483 15.1219C1.85131 14.9612 1.87343 14.7897 1.95631 14.6453L3.51881 11.9109C2.96998 11.4368 2.46531 10.9138 2.011 10.3484C1.95434 10.2852 1.91117 10.211 1.88412 10.1305C1.85707 10.05 1.84671 9.96488 1.85366 9.88024C1.86062 9.79561 1.88476 9.71328 1.9246 9.63828C1.96443 9.56328 2.01914 9.49719 2.08537 9.44403C2.1516 9.39088 2.22796 9.35178 2.30981 9.32912C2.39165 9.30646 2.47725 9.30072 2.56139 9.31225C2.64552 9.32377 2.72643 9.35232 2.79916 9.39616C2.8719 9.43999 2.93494 9.49819 2.98443 9.56719C4.28131 11.1719 6.55006 13.0828 9.9985 13.0828C13.4469 13.0828 15.7157 11.1695 17.0126 9.56719C17.0615 9.49677 17.1244 9.43718 17.1973 9.39211C17.2703 9.34704 17.3517 9.31747 17.4366 9.30523C17.5215 9.29299 17.608 9.29834 17.6907 9.32096C17.7734 9.34358 17.8506 9.38298 17.9174 9.4367C17.9842 9.49043 18.0393 9.55733 18.0792 9.63325C18.119 9.70917 18.1428 9.79248 18.1491 9.878C18.1554 9.96352 18.144 10.0494 18.1157 10.1304C18.0874 10.2113 18.0427 10.2855 17.9844 10.3484C17.5301 10.9138 17.0254 11.4368 16.4766 11.9109L18.0391 14.6453C18.0811 14.7166 18.1084 14.7955 18.1197 14.8774C18.1309 14.9594 18.1258 15.0427 18.1045 15.1227C18.0833 15.2026 18.0465 15.2775 17.9961 15.3431C17.9457 15.4087 17.8828 15.4636 17.811 15.5047Z" fill="#1C2024" />
                        </svg>
                      )}
                    </button>
                  </TextField.Slot>
                </TextField.Root>

                {errors.password && (
                  <Flex height="20px" justify="start" align="center" className="min-h-[20px]">
                    <Text color="red" size={{ initial: "1", sm: "2" }} className="text-xs sm:text-sm">
                      {errors.password.message}
                    </Text>
                  </Flex>
                )}

              </Flex>
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="1">
                  Confirm Password
                </Text>
                <TextField.Root
                  size={{ initial: "2", sm: "2" }}
                  placeholder="Confirm password"
                  variant={errors.confirmPassword ? "soft" : "surface"}
                  color={errors.confirmPassword ? "red" : undefined}
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value, formValues) =>
                      value === formValues.password ||
                      "Passwords do not match.",
                  })}
                >
                  <TextField.Slot side="right">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-1 hover:bg-gray-100 rounded flex items-center touch-manipulation"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M19.3211 9.74688C19.2937 9.68516 18.632 8.21719 17.1609 6.74609C15.2008 4.78594 12.725 3.75 9.99999 3.75C7.27499 3.75 4.79921 4.78594 2.83905 6.74609C1.36796 8.21719 0.703118 9.6875 0.678899 9.74688C0.643362 9.82681 0.625 9.91331 0.625 10.0008C0.625 10.0883 0.643362 10.1748 0.678899 10.2547C0.706243 10.3164 1.36796 11.7836 2.83905 13.2547C4.79921 15.2141 7.27499 16.25 9.99999 16.25C12.725 16.25 15.2008 15.2141 17.1609 13.2547C18.632 11.7836 19.2937 10.3164 19.3211 10.2547C19.3566 10.1748 19.375 10.0883 19.375 10.0008C19.375 9.91331 19.3566 9.82681 19.3211 9.74688ZM9.99999 15C7.5953 15 5.49452 14.1258 3.75546 12.4023C3.0419 11.6927 2.43483 10.8836 1.95312 10C2.4347 9.11636 3.04179 8.30717 3.75546 7.59766C5.49452 5.87422 7.5953 5 9.99999 5C12.4047 5 14.5055 5.87422 16.2445 7.59766C16.9595 8.307 17.5679 9.11619 18.0508 10C17.4875 11.0516 15.0336 15 9.99999 15ZM9.99999 6.25C9.25831 6.25 8.53329 6.46993 7.9166 6.88199C7.29992 7.29404 6.81927 7.87971 6.53544 8.56494C6.25162 9.25016 6.17735 10.0042 6.32205 10.7316C6.46674 11.459 6.82389 12.1272 7.34834 12.6517C7.87279 13.1761 8.54097 13.5333 9.2684 13.6779C9.99583 13.8226 10.7498 13.7484 11.4351 13.4645C12.1203 13.1807 12.7059 12.7001 13.118 12.0834C13.5301 11.4667 13.75 10.7417 13.75 10C13.749 9.00576 13.3535 8.05253 12.6505 7.34949C11.9475 6.64645 10.9942 6.25103 9.99999 6.25ZM9.99999 12.5C9.50554 12.5 9.02219 12.3534 8.61107 12.0787C8.19994 11.804 7.87951 11.4135 7.69029 10.9567C7.50107 10.4999 7.45157 9.99723 7.54803 9.51227C7.64449 9.02732 7.88259 8.58186 8.23222 8.23223C8.58186 7.8826 9.02731 7.6445 9.51227 7.54804C9.99722 7.45157 10.4999 7.50108 10.9567 7.6903C11.4135 7.87952 11.804 8.19995 12.0787 8.61107C12.3534 9.0222 12.5 9.50555 12.5 10C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 9.99999 12.5Z" fill="#1C2024" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22" fill="none">
                          <path d="M17.811 15.5047C17.7396 15.5454 17.6609 15.5716 17.5794 15.5819C17.4978 15.5921 17.4151 15.5862 17.3358 15.5644C17.2566 15.5427 17.1824 15.5055 17.1176 15.455C17.0527 15.4045 16.9984 15.3418 16.9579 15.2703L15.4735 12.6766C14.6105 13.2601 13.6586 13.6996 12.6547 13.9781L13.1133 16.7297C13.1269 16.8107 13.1243 16.8936 13.1058 16.9736C13.0873 17.0536 13.0532 17.1292 13.0054 17.196C12.9577 17.2628 12.8972 17.3196 12.8276 17.363C12.7579 17.4065 12.6803 17.4358 12.5993 17.4492C12.566 17.4547 12.5323 17.4576 12.4985 17.4578C12.3506 17.4576 12.2076 17.405 12.0949 17.3093C11.9822 17.2136 11.9071 17.081 11.8829 16.9352L11.4321 14.2336C10.4815 14.3659 9.51709 14.3659 8.56646 14.2336L8.11568 16.9352C8.09143 17.0813 8.01606 17.2141 7.90302 17.3098C7.78998 17.4055 7.64662 17.458 7.4985 17.4578C7.46395 17.4577 7.42947 17.4548 7.39537 17.4492C7.31435 17.4358 7.23678 17.4065 7.16709 17.363C7.0974 17.3196 7.03696 17.2628 6.98922 17.196C6.94148 17.1292 6.90738 17.0536 6.88886 16.9736C6.87034 16.8936 6.86778 16.8107 6.88131 16.7297L7.34225 13.9781C6.33883 13.6988 5.3874 13.2584 4.52506 12.6742L3.04537 15.2703C2.96249 15.4147 2.82563 15.5203 2.66491 15.5638C2.50419 15.6073 2.33276 15.5852 2.18834 15.5024C2.04392 15.4195 1.93834 15.2826 1.89483 15.1219C1.85131 14.9612 1.87343 14.7897 1.95631 14.6453L3.51881 11.9109C2.96998 11.4368 2.46531 10.9138 2.011 10.3484C1.95434 10.2852 1.91117 10.211 1.88412 10.1305C1.85707 10.05 1.84671 9.96488 1.85366 9.88024C1.86062 9.79561 1.88476 9.71328 1.9246 9.63828C1.96443 9.56328 2.01914 9.49719 2.08537 9.44403C2.1516 9.39088 2.22796 9.35178 2.30981 9.32912C2.39165 9.30646 2.47725 9.30072 2.56139 9.31225C2.64552 9.32377 2.72643 9.35232 2.79916 9.39616C2.8719 9.43999 2.93494 9.49819 2.98443 9.56719C4.28131 11.1719 6.55006 13.0828 9.9985 13.0828C13.4469 13.0828 15.7157 11.1695 17.0126 9.56719C17.0615 9.49677 17.1244 9.43718 17.1973 9.39211C17.2703 9.34704 17.3517 9.31747 17.4366 9.30523C17.5215 9.29299 17.608 9.29834 17.6907 9.32096C17.7734 9.34358 17.8506 9.38298 17.9174 9.4367C17.9842 9.49043 18.0393 9.55733 18.0792 9.63325C18.119 9.70917 18.1428 9.79248 18.1491 9.878C18.1554 9.96352 18.144 10.0494 18.1157 10.1304C18.0874 10.2113 18.0427 10.2855 17.9844 10.3484C17.5301 10.9138 17.0254 11.4368 16.4766 11.9109L18.0391 14.6453C18.0811 14.7166 18.1084 14.7955 18.1197 14.8774C18.1309 14.9594 18.1258 15.0427 18.1045 15.1227C18.0833 15.2026 18.0465 15.2775 17.9961 15.3431C17.9457 15.4087 17.8828 15.4636 17.811 15.5047Z" fill="#1C2024" />
                        </svg>
                      )}
                    </button>
                  </TextField.Slot>
                </TextField.Root>

                {errors.confirmPassword && (
                  <Flex height="20px" justify="start" align="center" className="min-h-[20px]">
                    <Text color="red" size={{ initial: "1", sm: "2" }} className="text-xs sm:text-sm">
                      {errors.confirmPassword.message}
                    </Text>
                  </Flex>
                )}

              </Flex>
            </Flex>
            <Button
              type="submit"
              variant="solid"
              size={{ initial: "3", sm: "3" }}
              disabled={!isValid || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Setting you up..." : "Join UT Vibe! 🎉"}
            </Button>
          </form>
          <Button
            variant="ghost"
            size={{ initial: "1", sm: "2" }}
            onClick={() => router.push("/")}
            className="text-xs sm:text-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to sign in
          </Button>
        </Flex>
      )}
    </>
  );
}

export default Signup;
