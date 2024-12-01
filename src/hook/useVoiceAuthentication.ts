// import {useState} from 'react';
// import {Buffer} from 'buffer';
// import {Alert} from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {useSelector, UseSelector} from 'react-redux';

// const baseApi = 'https://centralindia.api.cognitive.microsoft.com';
// const apiKey = 'd0e0bf2fcdd046c8b1e4dd1abdef8be0';

// export const useVoiceAuthentication = () => {
//   const [verificationProfile, setVerificationProfile] = useState(null);
//   const [remainingEnrollments, setRemainingEnrollments] = useState(3);
//   const [verificationResult, setVerificationResult] = useState({});

//   const user = useSelector((state: any) => state.user);

//   // Function to create the profile
//   const createTextIndependentVerificationProfile = async (
//     audioData1,
//     audioData2,
//   ) => {
//     try {
//       // if (verificationProfile && remainingEnrollments === 0) {
//       //   console.log('Verification enrollment already completed');
//       //   return;
//       // }

//       if (!audioData1 && !audioData2) {
//         console.log('Please provide proper audio data');
//         return {
//           success: false,
//           status: 'fail',
//           data: 'Please provide proper audio data',
//         };
//       }

//       // const assetPath = 'harvard.wav';

//       // const audioData = await RNFetchBlob.fs.readFile(
//       //   RNFetchBlob.fs.asset(assetPath),
//       //   'base64',
//       // );

//       // const blob = Buffer.from(audioData, 'base64'); // Corrected buffer format

//       // const assetPath1 = 'girl_voice_1.mp3';
//       // const assetPath2 = 'girl_voice_2.mp3';

//       // const audioData1 = await RNFetchBlob.fs.readFile(
//       //   RNFetchBlob.fs.asset(assetPath1),
//       //   'base64',
//       // );

//       // const audioData2 = await RNFetchBlob.fs.readFile(
//       //   RNFetchBlob.fs.asset(assetPath2),
//       //   'base64',
//       // );

//       const blob1 = Buffer.from(audioData1, 'base64');
//       const blob2 = Buffer.from(audioData2, 'base64');

//       // If no profile exists, create one
//       if (!verificationProfile) {
//         const response = await fetch(
//           `${baseApi}/speaker/verification/v2.0/text-independent/profiles`,
//           {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               'Ocp-Apim-Subscription-Key': apiKey,
//             },
//             body: JSON.stringify({locale: 'en-us'}),
//           },
//         );

//         if (!response.ok) {
//           const errorMessage = await response.text();
//           console.error('Error creating profile:', errorMessage);
//           return {success: false, status: 'fail', data: errorMessage};
//         }

//         const data = await response.json();

//         setVerificationProfile(data);

//         const enrollingResponse1 =
//           await enrollTextIndependentProfileAudioForVerification(
//             blob1,
//             data.profileId,
//           );

//         if (!enrollingResponse1.success) {
//           console.error('Failed to enroll first audio');
//           return enrollingResponse1;
//         }

//         const enrollingResponse2 =
//           await enrollTextIndependentProfileAudioForVerification(
//             blob2,
//             data.profileId,
//           );

//         if (!enrollingResponse2.success) {
//           console.error('Failed to enroll Second audio');
//           return enrollingResponse2;
//         }

//         const asyncData = JSON.stringify({
//           profileId: data.profileId,
//           email: user.email,
//           password: 'qwert123',
//         });

//         await AsyncStorage.setItem('voiceData', asyncData);

//         return {success: true, status: 'success', data: `Profile created with ${data.profileId}`};
//       } else {
//         // const enrollingResponse1 =
//         //   await enrollTextIndependentProfileAudioForVerification(
//         //     blob1,
//         //     verificationProfile?.profileId,
//         //   );
//         // if (!enrollingResponse1?.success) {
//         //   console.error('Failed to enroll first audio');
//         //   return enrollingResponse1;
//         // }

//         // const enrollingResponse2 =
//         //   await enrollTextIndependentProfileAudioForVerification(
//         //     blob2,
//         //     verificationProfile.profileId,
//         //   );

//         // if (!enrollingResponse2.success) {
//         //   console.error('Failed to enroll Second audio');
//         //   return enrollingResponse2;
//         // }

//         // console.log('Profile is already created');
//         return {
//           success: false,
//           status: 'fail',
//           data: 'Profile is already created',
//         };
//       }
//     } catch (error) {
//       console.error('Profile creation error:', error);
//       return {success: false, status: 'fail', data: error};
//     }
//   };

//   // Function to enroll audio into the profile
//   const enrollTextIndependentProfileAudioForVerification = async (
//     audioData,
//     profileId,
//   ) => {
//     const blob = Buffer.from(audioData, 'base64');

//     try {
//       if (!audioData) {
//         return {
//           success: false,
//           status: 'fail',
//           data: 'Please provide proper audio data',
//         };
//       }

//       console.log(profileId);

//       const URL = `${baseApi}/speaker/verification/v2.0/text-independent/profiles/${profileId}/enrollments?ignoreMinLength=false`;

//       const response = await fetch(URL, {
//         method: 'POST',
//         headers: {
//           'Ocp-Apim-Subscription-Key': apiKey,
//           // Include content type for binary data if necessary
//           'Content-Type': 'application/octet-stream',
//         },
//         body: blob, // Make sure you're sending binary data
//       });

//       console.log('================= enroll resp ===================');
//       console.log(response);
//       console.log('====================================');

//       if (!response.ok) {
//         return {
//           success: false,
//           status: 'fail',
//           data: 'Failed to Enroll audio',
//         };
//       }

//       const data = await response.json();

//       console.log('================ enroll data ====================');
//       console.log(data);
//       console.log('====================================');

//       setRemainingEnrollments(data.remainingEnrollmentsSpeechLength);
//       console.log(
//         'Enrollment remaining speech length:',
//         data.remainingEnrollmentsSpeechLength,
//       );

//       if (data.remainingEnrollmentsSpeechLength === 0) {
//         // Alert.alert('Success', 'Verification enabled!');
//         return {success: true, status: 'success', data: profileId};
//       } else {
//         return {
//           success: false,
//           status: 'fail',
//           data: 'Please ensure your audio is recorded correctly.',
//         };
//       }
//     } catch (err) {
//       console.error('Enrollment error:', err);
//       // Alert.alert('Error', 'Failed to enroll audio for verification');
//       return {success: false, status: 'fail', data: profileId, error: err};
//     }
//   };

//   // Function to verify the recorded audio against the profile
//   const verifyTextIndependentProfile = async (audioData, profileId) => {
//     // console.log('====================================');
//     // console.log(profileId);
//     // console.log('====================================');

//     if (!profileId) {
//       console.error('Profile not created yet.');
//       return {
//         success: false,
//         status: 'fail',
//         message: 'Profile not created yet.',
//       };
//     }

//     if (!audioData) {
//       console.error('Please provide audio data');
//       return {
//         success: false,
//         status: 'fail',
//         message: 'Please provide audio data',
//       };
//     }

//     const blob = Buffer.from(audioData, 'base64');

//     try {
//       const response = await fetch(
//         `${baseApi}/speaker/verification/v2.0/text-independent/profiles/${profileId}/verify`,
//         {
//           method: 'POST',
//           headers: {
//             'Ocp-Apim-Subscription-Key': apiKey,
//             'Content-Type': 'application/octet-stream',
//           },
//           body: blob, // Sending binary data
//         },
//       );

//       if (!response.ok) {
//         const errorBody = await response.text();
//         // console.log('==================== erwsdfv ================');
//         // console.log(response);
//         // console.log('====================================');
//         const errorData = JSON.parse(errorBody);
//         console.log(errorData?.error?.message);

//         return {
//           status: false,
//           message: errorData?.error?.message,
//           statusCode: response.status,
//           statusText: response.statusText,
//         };
//       }

//       const result = await response.json();
//       setVerificationResult(result);
//       if (result.recognitionResult === 'Accept') {
//         // Alert.alert('Verification Successful', `Score: ${result.score}`);
//         console.log('Verification Successful', `Score: ${result.score}`);
//         return {
//           success: true,
//           status: 'success',
//           message: `Verification Successful, Score: ${result.score}`,
//           score: result.score,
//         };
//       } else {
//         console.log(
//           'Verification Failed',
//           `The voice did not match the enrolled profile.`,
//         );
//         return {
//           success: false,
//           status: 'fail',
//           message: `Verification failed: The voice did not match the enrolled profile.`,
//         };
//       }
//       // Alert.alert('Verification Result', JSON.stringify(result));
//     } catch (error) {
//       console.error('Verification error:', error);
//       return {
//         success: false,
//         status: 'fail',
//         message: `Verification Error: ${error}.`,
//       };
//     }
//   };

//   const deleteProfile = async profileId => {
//     try {
//       const response = await fetch(
//         `${baseApi}/speaker/verification/v2.0/text-independent/profiles/${profileId}`,
//         {
//           method: 'DELETE',
//           headers: {
//             'Ocp-Apim-Subscription-Key': apiKey,
//           },
//         },
//       );

//       if (!response.ok) {
//         console.error(`Failed to delete profile: ${response.statusText}`);
//         return {
//           success: false,
//           message: `Failed to delete profile with ID ${profileId}`,
//         };
//       }

//       return {
//         success: true,
//         message: `Profile with ID ${profileId} deleted successfully`,
//       };
//     } catch (err) {
//       console.error('Error deleting profile:', err);
//       return {success: false, message: 'Error deleting profile', error: err};
//     }
//   };

//   const getAllProfiles = async () => {
//     try {
//       const response = await fetch(
//         `${baseApi}/speaker/verification/v2.0/text-independent/profiles`,
//         {
//           method: 'GET',
//           headers: {
//             'Ocp-Apim-Subscription-Key': apiKey,
//           },
//         },
//       );

//       if (!response.ok) {
//         console.error(`Failed to fetch profiles: ${response.statusText}`);
//         return {success: false, message: 'Failed to fetch profiles'};
//       }

//       const profilesData = await response.json();
//       console.log('All Registered Profiles:', profilesData);

//       return {success: true, data: profilesData};
//     } catch (err) {
//       console.error('Error fetching profiles:', err);
//       return {success: false, message: 'Error fetching profiles', error: err};
//     }
//   };

//   return {
//     verificationProfile,
//     remainingEnrollments,
//     verificationResult,
//     createTextIndependentVerificationProfile,
//     enrollTextIndependentProfileAudioForVerification,
//     verifyTextIndependentProfile,
//     deleteProfile,
//     getAllProfiles,
//   };
// };

// export default useVoiceAuthentication;

import {useState} from 'react';
import {Buffer} from 'buffer';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSelector} from 'react-redux';

const baseApi = 'https://centralindia.api.cognitive.microsoft.com';
const apiKey = 'd0e0bf2fcdd046c8b1e4dd1abdef8be0';

export const useVoiceAuthentication = () => {
  const [verificationProfile, setVerificationProfile] = useState(null);
  const [remainingEnrollments, setRemainingEnrollments] = useState(3);
  const [verificationResult, setVerificationResult] = useState({});

  const user = useSelector((state: any) => state.user);

  // Function to create the profile
  const createTextIndependentVerificationProfile = async () => {
    try {
      // If no profile exists, create one
      if (!verificationProfile) {
        const response = await fetch(
          `${baseApi}/speaker/verification/v2.0/text-independent/profiles`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Ocp-Apim-Subscription-Key': apiKey,
            },
            body: JSON.stringify({locale: 'en-us'}),
          },
        );

        if (!response.ok) {
          const errorMessage = await response.text();
          console.error('Error creating profile:', errorMessage);
          return {success: false, status: 'fail', message: errorMessage};
        }

        const data = await response.json();

        setVerificationProfile(data);

        console.log("Profile created data => ",data);

        const asyncData = JSON.stringify({
          profileData: data,
          email: user.email,
          password: '123456',
        });

        await AsyncStorage.setItem('voiceData', asyncData);

        return {
          success: true,
          status: 'success',
          message: `Profile created with ${data.profileId}`,
          data: data,
        };
      } else {
        return {
          success: false,
          status: 'fail',
          message: 'Profile is already created',
        };
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      return {success: false, status: 'fail', message: error};
    }
  };

  // Function to enroll audio into the profile
  const enrollTextIndependentProfileAudioForVerification = async (
    audioData,
    profileId,
  ) => {
    console.log('================ enrolling audio ====================');
    console.log(profileId);
    console.log('====================================');

    const blob = Buffer.from(audioData, 'base64');

    try {
      if (!audioData) {
        return {
          success: false,
          status: 'fail',
          message: 'Please provide proper audio data',
        };
      }

      console.log('Enroll Profile Data : ', profileId);

      const URL = `${baseApi}/speaker/verification/v2.0/text-independent/profiles/${profileId}/enrollments?ignoreMinLength=false`;

      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          // Include content type for binary data if necessary
          'Content-Type': 'application/octet-stream',
        },
        body: blob, // Make sure you're sending binary data
      });

      console.log('================= enroll resp ===================');
      console.log(response);
      console.log('====================================');

      if (!response.ok) {
        return {
          success: false,
          status: 'fail',
          message: 'Failed to Enroll audio',
        };
      }

      const data = await response.json();

      console.log('================ enroll data ====================');
      console.log(data);
      console.log('====================================');

      setRemainingEnrollments(data.remainingEnrollmentsSpeechLength);
      console.log(
        'Enrollment remaining speech length:',
        data.remainingEnrollmentsSpeechLength,
      );

      if (data.remainingEnrollmentsSpeechLength === 0) {
        // Alert.alert('Success', 'Verification enabled!');
        return {
          success: true,
          status: 'success',
          message: 'Enrollment Success',
          data: data,
        };
      } else {
        return {
          success: false,
          status: 'fail',
          message: 'Please ensure your audio is recorded correctly.',
        };
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      // Alert.alert('Error', 'Failed to enroll audio for verification');
      return {
        success: false,
        status: 'fail',
        message: 'Failed to enroll audio for verification',
        error: err?.data,
      };
    }
  };

  // Function to verify the recorded audio against the profile
  const verifyTextIndependentProfile = async (audioData, profileId) => {
    console.log('==========profileId=========');
    console.log(profileId);
    console.log('====================================');
    if (!profileId) {
      console.error('Profile not created yet.');
      return {
        success: false,
        status: 'fail',
        message: 'Profile not created yet.',
      };
    }

    if (!audioData) {
      console.error('Please provide audio data');
      return {
        success: false,
        status: 'fail',
        message: 'Please provide audio data',
      };
    }

    const blob = Buffer.from(audioData, 'base64');

    try {
      const response = await fetch(
        `${baseApi}/speaker/verification/v2.0/text-independent/profiles/${profileId}/verify`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'application/octet-stream',
          },
          body: blob, // Sending binary data
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        // console.log('==================== erwsdfv ================');
        // console.log(response);
        // console.log('====================================');
        const errorData = JSON.parse(errorBody);
        console.log(errorData?.error?.message);

        return {
          status: false,
          message: errorData?.error?.message,
          statusCode: response.status,
          statusText: response.statusText,
        };
      }

      const result = await response.json();
      setVerificationResult(result);
      if (result.recognitionResult === 'Accept') {
        // Alert.alert('Verification Successful', `Score: ${result.score}`);
        console.log('Verification Successful', `Score: ${result.score}`);
        return {
          success: true,
          status: 'success',
          message: `Verification Successful, Score: ${result.score}`,
          score: result.score,
        };
      } else {
        console.log(
          'Verification Failed',
          `The voice did not match the enrolled profile.`,
        );
        return {
          success: false,
          status: 'fail',
          message: `Verification failed: The voice did not match the enrolled profile.`,
        };
      }
      // Alert.alert('Verification Result', JSON.stringify(result));
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        status: 'fail',
        message: `Verification Error: ${error}.`,
      };
    }
  };

  const deleteProfile = async profileId => {
    try {
      const response = await fetch(
        `${baseApi}/speaker/verification/v2.0/text-independent/profiles/${profileId}`,
        {
          method: 'DELETE',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
          },
        },
      );

      if (!response.ok) {
        console.error(`Failed to delete profile: ${response.statusText}`);
        return {
          success: false,
          message: `Failed to delete profile with ID ${profileId}`,
        };
      }

      return {
        success: true,
        message: `Profile with ID ${profileId} deleted successfully`,
      };
    } catch (err) {
      console.error('Error deleting profile:', err);
      return {success: false, message: 'Error deleting profile', error: err};
    }
  };

  const getAllProfiles = async () => {
    try {
      const response = await fetch(
        `${baseApi}/speaker/verification/v2.0/text-independent/profiles`,
        {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
          },
        },
      );

      if (!response.ok) {
        console.error(`Failed to fetch profiles: ${response.statusText}`);
        return {success: false, message: 'Failed to fetch profiles'};
      }

      const profilesData = await response.json();
      console.log('All Registered Profiles:', profilesData);

      return {success: true, data: profilesData};
    } catch (err) {
      console.error('Error fetching profiles:', err);
      return {success: false, message: 'Error fetching profiles', error: err};
    }
  };

  // Method to get profile data using profile ID
  const getProfileData = async profileId => {
    try {
      console.log('=========== getProfileData ==========');
      console.log(profileId);
      console.log('====================================');

      const response = await fetch(
        `${baseApi}/speaker/verification/v2.0/text-independent/profiles/${profileId}`,
        {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
          },
        },
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Error fetching profile data:', errorMessage);
        return {success: false, status: 'fail', message: errorMessage};
      }

      const data = await response.json();
      console.log('Profile Data:', data);
      return {success: true, status: 'success', data: data};
    } catch (error) {
      console.error('Error fetching profile data:', error);
      return {success: false, status: 'fail', message: error};
    }
  };

  return {
    verificationProfile,
    remainingEnrollments,
    verificationResult,
    createTextIndependentVerificationProfile,
    enrollTextIndependentProfileAudioForVerification,
    verifyTextIndependentProfile,
    deleteProfile,
    getAllProfiles,
    getProfileData,
  };
};

export default useVoiceAuthentication;
