"use client";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  TextField,
} from "@radix-ui/themes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeftIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";
import OtpInput from "@/components/OtpInput";
import { useToast } from "@/provider/ToastContext";

function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otpError, setOtpError] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);
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

const handleCreatePassword = async (data) => {

  setIsLoading(true);
  try {
    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });



    if (res.data.success) {
      showToast("Password reset successful!");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1000);
    } else {
      showToast(res.data.message || "⚠️ Failed to reset password");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    showToast(
      error.res?.data?.message ||
        "Something went wrong. Please try again later."
    );
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
      handleCreatePassword(data);
    }
  };

  return (
    <>
      {!showOtpField ? (
        <Flex
          maxWidth="480px"
          direction="column"
          align="start"
          justify="center"
          className="mx-auto p-4 sm:p-5 md:p-6 w-full min-h-screen"
          gap="6 sm:gap-8"
        >
          <Flex direction="column" gap="2" width="100%">
            <Text as="p" size={{ initial: "5", sm: "7" }} weight="light">
              Forgot your password? No worries!
            </Text>
            <Text
              as="p"
              color="gray"
              size={{ initial: "2", sm: "3" }}
              className="my-4 sm:my-6 md:my-10"
              weight="regular"
            >
              Drop your email and we'll send you a code to reset it. Easy peasy!
            </Text>
          </Flex>
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Flex direction="column" gap="5 sm:gap-6" width="100%">
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="2">
                  Email
                </Text>
                <TextField.Root
                  size={{ initial: "2", sm: "2" }}
                  placeholder="Enter email address"
                  variant={errors.email ? "soft" : "surface"}
                  color={errors.email ? "red" : undefined}
                  className="w-full"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter the email id in correct format",
                    },
                  })}
                />
                <Flex height="20px" justify="start" align="center" className="min-h-[20px]">
                  {errors.email && (
                    <Text color="red" size={{ initial: "1", sm: "2" }} className="text-xs sm:text-sm">
                      {errors.email.message}
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
                {isLoading ? "Sending code..." : "Send me the code 📧"}
              </Button>
            </Flex>
          </form>
          <Flex gap="2">
            <Box>
              <Button
                variant="ghost"
                size={{ initial: "1", sm: "2" }}
                onClick={() => router.push("/auth/login")}
                className="text-xs sm:text-sm"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to Sign in
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
                A verification code has been sent to
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
            <Flex gap="1" direction={{ initial: "column", sm: "row" }} align={{ initial: "start", sm: "center" }} className="w-full">
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
                  className={`${!isResendDisabled ? '!underline !underline-offset-2' : '!text-[#8B8D98]'} hover:!bg-transparent text-xs sm:text-sm`}
                >
                  {isResendDisabled
                    ? `Resend code in ${countdown}s.`
                    : "Resend code."}
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
              Create password
            </Text>
            <Text as="p" color="gray" size={{ initial: "2", sm: "3" }} className="my-4 sm:my-6 md:my-10" weight="light">
              Your password must be at least 8 characters and include at least
              one special character
            </Text>
          </Flex>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col gap-6 sm:gap-8"
          >
            <Flex direction="column" gap="4 sm:gap-5" width="100%">
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="2">
                  Password
                </Text>
                <Box className="w-full">
                  <TextField.Root
                    size={{ initial: "2", sm: "2" }}
                    placeholder="Create a new password"
                    variant={errors.password ? "soft" : "surface"}
                    className={`${
                      errors.password
                        ? "!bg-[#FBECEC] focus-within:!outline-[#DC4242]"
                        : "focus-within:!outline-[#3F7FC0] focus-within:!bg-transparent"
                    } mb-1 w-full`}
                    type={showPass ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                  >
                    <TextField.Slot side="right">
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPass(!showPass);
                        }}
                        className="touch-manipulation"
                      >
                        {showPass ? (
                          <EyeOpenIcon height="14" width="14" />
                        ) : (
                          <EyeClosedIcon height="14" width="14" />
                        )}
                      </IconButton>
                    </TextField.Slot>
                  </TextField.Root>
                  <Flex height="20px" justify="start" align="center" className="min-h-[20px]">
                    {errors.password && (
                      <Text className="text-[#DC4242] text-xs sm:text-sm font-normal">
                        {errors.password.message}
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
              <Flex direction="column" gap="2">
                <Text as="div" size="1" weight="medium" color="gray" pb="2">
                  Confirm Password
                </Text>
                <Box className="w-full">
                  <TextField.Root
                    size={{ initial: "2", sm: "2" }}
                    placeholder="Confirm password"
                    variant={errors.confirmPassword ? "soft" : "surface"}
                    className={`${
                      errors.confirmPassword
                        ? "!bg-[#FBECEC] focus-within:!outline-[#DC4242]"
                        : "focus-within:!outline-[#3F7FC0] focus-within:!bg-transparent"
                    } mb-1 w-full`}
                    type={showConfPass ? "text" : "password"}
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value, formValues) =>
                        value === formValues.password ||
                        "Passwords do not match.",
                    })}
                  >
                    <TextField.Slot side="right">
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowConfPass(!showConfPass);
                        }}
                        className="touch-manipulation"
                      >
                        {showConfPass ? (
                          <EyeOpenIcon height="14" width="14" />
                        ) : (
                          <EyeClosedIcon height="14" width="14" />
                        )}
                      </IconButton>
                    </TextField.Slot>
                  </TextField.Root>
                  <Flex height="20px" justify="start" align="center" className="min-h-[20px]">
                    {errors.confirmPassword && (
                      <Text className="text-[#DC4242] text-xs sm:text-sm font-normal">
                        {errors.confirmPassword.message}
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
            </Flex>
            <Button
              type="submit"
              variant="solid"
              size={{ initial: "3", sm: "3" }}
              disabled={!isValid || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Resetting..." : "Reset password ✨"}
            </Button>
          </form>
          <Button
            variant="ghost"
            size={{ initial: "1", sm: "2" }}
            onClick={() => router.push("/auth/login")}
            className="text-xs sm:text-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Sign in
          </Button>
        </Flex>
      )}
    </>
  );
}

export default ForgotPassword;
