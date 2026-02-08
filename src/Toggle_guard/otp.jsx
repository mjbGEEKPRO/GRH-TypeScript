return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden" style={{ backgroundColor: colors.gray }}>
      {/* ... éléments décoratifs ... */}

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-4">
            <AnimatedLogo />
          </div>

          {/* Afficher l'OTP ou le formulaire d'inscription */}
          {showOTP ? (
            <OTPVerification 
              email={otpData.email} 
              otpCode={otpData.code} 
            />
          ) : (
            <>
              <UserTypeSwitch userType={userType} setUserType={setUserType} />
              
              {/* ... reste du formulaire ... */}
            </>
          )}
        </div>
      </div>
    </div>
  );