// // risk-engine.js

// /**
//  * Risk Engine - Calculate comprehensive risk score for a merchant
//  * @param {Object} merchant - Merchant data with documents
//  * @returns {Object} Risk assessment and decision
//  */
// function assessMerchantRisk(merchant) {
//   if (!merchant || !merchant.documents) {
//     return {
//       overallRiskScore: 1.0,
//       riskLevel: 'extreme',
//       documentRisks: {},
//       crossValidationRisk: 1.0,
//       decision: 'reject',
//       reasons: ['Insufficient data for risk assessment']
//     };
//   }
  
//   const documents = merchant.documents;
//   const documentRisks = {};
//   const documentWeights = {
//     'pan': 0.35,
//     'selfie': 0.3,
//     'gst': 0.2,
//     'bank': 0.15
//   };
  
//   // Missing document penalties
//   const requiredDocs = ['pan', 'selfie'];
//   const recommendedDocs = ['gst', 'bank'];
  
//   let missingRequiredCount = 0;
//   let missingRecommendedCount = 0;
  
//   // Calculate individual document risks
//   for (const docType of [...requiredDocs, ...recommendedDocs]) {
//     if (!documents[docType]) {
//       if (requiredDocs.includes(docType)) {
//         missingRequiredCount++;
//       } else {
//         missingRecommendedCount++;
//       }
//       continue;
//     }
    
//     const doc = documents[docType];
//     documentRisks[docType] = {
//       riskScore: doc.riskScore !== undefined ? doc.riskScore : 0.5,
//       confidenceScore: doc.confidenceScore || 0,
//       verificationStatus: doc.status || 'unknown',
//       weight: documentWeights[docType] || 0.1
//     };
//   }
  
//   // Assess quality of verification
//   let weightedRiskSum = 0;
//   let totalWeight = 0;
  
//   Object.keys(documentRisks).forEach(docType => {
//     const risk = documentRisks[docType];
//     weightedRiskSum += risk.riskScore * risk.weight;
//     totalWeight += risk.weight;
//   });
  
//   // Cross-validation risk (identity consistency)
//   let crossValidationRisk = 0.5;
//   if (documents.pan && documents.bank) {
//     // Check if name on PAN matches name on bank account
//     const panName = documents.pan.extractedData?.name?.toLowerCase();
//     const bankName = documents.bank.extractedData?.accountHolderName?.toLowerCase();
    
//     if (panName && bankName) {
//       if (panName === bankName) {
//         crossValidationRisk = 0.1; // Exact match
//       } else if (panName.includes(bankName) || bankName.includes(panName)) {
//         crossValidationRisk = 0.3; // Partial match
//       } else {
//         crossValidationRisk = 0.9; // No match
//       }
//     }
//   }
  
//   // Calculate missing document penalty
//   const missingRequiredPenalty = missingRequiredCount * 0.3;
//   const missingRecommendedPenalty = missingRecommendedCount * 0.1;
  
//   // Calculate weighted document risk
//   const documentRisk = totalWeight > 0 ? (weightedRiskSum / totalWeight) : 0.8;
  
//   // Calculate overall risk with penalties
//   let overallRiskScore = (
//     documentRisk * 0.6 + 
//     crossValidationRisk * 0.4 + 
//     missingRequiredPenalty + 
//     missingRecommendedPenalty
//   );
  
//   // Cap at 1.0
//   overallRiskScore = Math.min(overallRiskScore, 1.0);
  
//   // Determine risk level
//   let riskLevel;
//   if (overallRiskScore < 0.3) {
//     riskLevel = 'low';
//   } else if (overallRiskScore < 0.5) {
//     riskLevel = 'moderate';
//   } else if (overallRiskScore < 0.7) {
//     riskLevel = 'high';
//   } else {
//     riskLevel = 'extreme';
//   }
  
//   // Make decision
//   let decision;
//   let reasons = [];
  
//   if (missingRequiredCount > 0) {
//     decision = 'reject';
//     reasons.push('Missing required documents');
//   } else if (overallRiskScore < 0.3) {
//     decision = 'auto_approve';
//     reasons.push('Low risk profile');
//   } else if (overallRiskScore < 0.7) {
//     decision = 'manual_review';
//     reasons.push('Risk requires manual review');
//   } else {
//     decision = 'reject';
//     reasons.push('High risk profile');
//   }
  
//   // Document-specific reasons
//   Object.keys(documentRisks).forEach(docType => {
//     if (documentRisks[docType].riskScore > 0.7) {
//       reasons.push(`High risk in ${docType} document`);
//     }
//   });
  
//   if (crossValidationRisk > 0.7) {
//     reasons.push('Identity inconsistency across documents');
//   }
  
//   return {
//     overallRiskScore,
//     riskLevel,
//     documentRisks,
//     crossValidationRisk,
//     decision,
//     reasons
//   };
// }

// module.exports = {
//   assessMerchantRisk
// };


/**
 * Comprehensive risk assessment engine for merchant onboarding
 */
function assessMerchantRisk(merchant) {
  if (!merchant) {
    return {
      overallRiskScore: 1.0,
      riskLevel: 'high',
      decision: 'manual_review',
      reasons: ['Insufficient data for assessment']
    };
  }
  
  // Initialize risk factors and scores
  const riskFactors = [];
  const riskComponents = {
    documentRisk: assessDocumentRisk(merchant, riskFactors),
    identityRisk: assessIdentityRisk(merchant, riskFactors),
    businessRisk: assessBusinessRisk(merchant, riskFactors),
    behavioralRisk: assessBehavioralRisk(merchant, riskFactors),
    crossValidationRisk: assessCrossValidationRisk(merchant, riskFactors)
  };
  
  // Apply risk weights to get overall score
  const overallRiskScore = calculateWeightedRiskScore(riskComponents);
  
  // Determine risk level
  const riskLevel = determineRiskLevel(overallRiskScore);
  
  // Make decision based on risk assessment
  const decision = makeDecision(merchant, overallRiskScore, riskLevel, riskFactors);
  
  // Prepare detailed risk report
  return {
    overallRiskScore,
    riskLevel,
    decision: decision.action,
    reasons: decision.reasons,
    riskComponents,
    riskFactors,
    recommendedActions: generateRecommendations(merchant, riskLevel, riskFactors),
    timestamp: new Date().toISOString()
  };
}

// Document risk assessment
function assessDocumentRisk(merchant, riskFactors) {
  if (!merchant.documents || Object.keys(merchant.documents).length === 0) {
    riskFactors.push('No documents submitted');
    return 1.0;
  }
  
  let totalRisk = 0;
  let documentCount = 0;
  
  // Required documents check
  const requiredDocs = ['pan', 'selfie'];
  const missingDocs = requiredDocs.filter(doc => !merchant.documents[doc]);
  
  if (missingDocs.length > 0) {
    missingDocs.forEach(doc => {
      riskFactors.push(`Missing required document: ${doc}`);
    });
  }
  
  // Assess risk for each document
  Object.entries(merchant.documents).forEach(([docType, doc]) => {
    if (doc.riskScore !== undefined) {
      // Add risk factor for high-risk documents
      if (doc.riskScore > 0.7) {
        riskFactors.push(`High-risk ${docType} document (${Math.round(doc.riskScore * 100)}%)`);
      }
      
      totalRisk += doc.riskScore;
      documentCount++;
    }
  });
  
  return documentCount > 0 ? totalRisk / documentCount : 0.8;
}

// Identity risk assessment
function assessIdentityRisk(merchant, riskFactors) {
  // Check for selfie verification
  const selfie = merchant.documents?.selfie;
  if (!selfie) {
    riskFactors.push('No selfie verification');
    return 0.9;
  }
  
  // If selfie verification failed
  if (selfie.verified === false) {
    riskFactors.push('Selfie verification failed');
    return 0.85;
  }
  
  // If liveness detection is available
  if (selfie.liveness !== undefined) {
    if (selfie.liveness < 0.6) {
      riskFactors.push(`Low liveness score: ${Math.round(selfie.liveness * 100)}%`);
      return 0.8;
    }
  }
  
  // Check face quality
  if (selfie.qualityScore !== undefined && selfie.qualityScore < 0.6) {
    riskFactors.push(`Poor selfie quality: ${Math.round(selfie.qualityScore * 100)}%`);
    return 0.7;
  }
  
  // Check for other risk factors in face attributes
  if (selfie.faceAttributes) {
    if (selfie.faceAttributes.headwearLikelihood > 2) {
      riskFactors.push('Headwear detected in selfie');
      return 0.6;
    }
  }
  
  // Low risk if all checks pass
  return 0.2;
}

// Business risk assessment
function assessBusinessRisk(merchant, riskFactors) {
  // Check GST document
  const gst = merchant.documents?.gst;
  if (!gst) {
    // Not critical but increases risk slightly
    return 0.4;
  }
  
  if (gst.verified === false) {
    riskFactors.push('GST verification failed');
    return 0.6;
  }
  
  // Extract business data
  const businessName = gst.extractedData?.businessName;
  const businessAddress = gst.extractedData?.businessAddress;
  
  if (!businessName || !businessAddress) {
    riskFactors.push('Incomplete business information');
    return 0.5;
  }
  
  // Low risk for verified business
  return 0.3;
}

// Behavioral risk assessment
function assessBehavioralRisk(merchant, riskFactors) {
  // Check for multiple submission attempts
  if (merchant.submissionAttempts && merchant.submissionAttempts > 3) {
    riskFactors.push(`Multiple submission attempts: ${merchant.submissionAttempts}`);
    return 0.7;
  }
  
  // Check time spent on verification process
  const createdAt = merchant.createdAt ? new Date(merchant.createdAt) : null;
  const updatedAt = merchant.updatedAt ? new Date(merchant.updatedAt) : null;
  
  if (createdAt && updatedAt) {
    const processingTime = (updatedAt - createdAt) / (1000 * 60); // minutes
    
    if (processingTime < 2) {
      riskFactors.push('Suspiciously fast application completion');
      return 0.8;
    }
  }
  
  // Default moderate risk
  return 0.4;
}

// Cross-validation risk assessment
function assessCrossValidationRisk(merchant, riskFactors) {
  if (!merchant.crossValidation) {
    return 0.5; // Neutral risk when no cross-validation data
  }
  
  if (merchant.crossValidation.verified === false) {
    // Add specific mismatch details to risk factors
    if (merchant.crossValidation.mismatches && merchant.crossValidation.mismatches.length > 0) {
      merchant.crossValidation.mismatches.forEach(mismatch => {
        riskFactors.push(`Data mismatch: ${mismatch.field} between ${mismatch.documents.join(' and ')}`);
      });
    } else {
      riskFactors.push('Cross-document validation failed');
    }
    return 0.8;
  }
  
  // Calculate risk based on consistency score
  const consistencyScore = merchant.crossValidation.overallConsistency || 0;
  return 1 - consistencyScore;
}

// Calculate weighted risk score
function calculateWeightedRiskScore(riskComponents) {
  // Risk component weights
  const weights = {
    documentRisk: 0.3,
    identityRisk: 0.25,
    businessRisk: 0.15,
    behavioralRisk: 0.1,
    crossValidationRisk: 0.2
  };
  
  // Calculate weighted sum
  let weightedScore = 0;
  let totalWeight = 0;
  
  Object.entries(riskComponents).forEach(([component, score]) => {
    weightedScore += score * weights[component];
    totalWeight += weights[component];
  });
  
  return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
}

// Determine risk level from score
function determineRiskLevel(riskScore) {
  if (riskScore < 0.3) return 'low';
  if (riskScore < 0.6) return 'medium';
  return 'high';
}

// Make decision based on risk assessment
function makeDecision(merchant, riskScore, riskLevel, riskFactors) {
  // Check for required documents
  const requiredDocs = ['pan', 'selfie'];
  const hasRequiredDocs = requiredDocs.every(doc => merchant.documents && merchant.documents[doc]);
  
  if (!hasRequiredDocs) {
    return {
      action: 'pending',
      reasons: ['Missing required documents']
    };
  }
  
  // Auto-approve low-risk merchants
  if (riskLevel === 'low' && riskFactors.length === 0) {
    return {
      action: 'auto_approve',
      reasons: ['Low risk profile', 'All verifications passed']
    };
  }
  
  // Auto-reject high-risk merchants with critical issues
  if (riskLevel === 'high') {
    // Check for critical risk factors
    const criticalFactors = riskFactors.filter(factor => 
      factor.includes('verification failed') || 
      factor.includes('Multiple faces') ||
      factor.includes('No face detected') ||
      factor.includes('Data mismatch')
    );
    
    if (criticalFactors.length > 0) {
      return {
        action: 'reject',
        reasons: criticalFactors
      };
    }
  }
  
  // Default to manual review for medium risk or non-critical high risk
  return {
    action: 'manual_review',
    reasons: riskFactors.length > 0 ? riskFactors : ['Risk assessment requires manual review']
  };
}

// Generate recommendations based on risk assessment
function generateRecommendations(merchant, riskLevel, riskFactors) {
  const recommendations = [];
  
  // Add document-specific recommendations
  const documents = merchant.documents || {};
  
  if (!documents.pan) {
    recommendations.push('Submit PAN card for verification');
  }
  
  if (!documents.selfie) {
    recommendations.push('Submit a clear selfie for verification');
  } else if (documents.selfie.verified === false) {
    recommendations.push('Submit a new selfie with better lighting and a neutral background');
  }
  
  if (!documents.gst && riskLevel !== 'low') {
    recommendations.push('Submit GST registration for additional verification');
  }
  
  if (!documents.bank) {
    recommendations.push('Submit bank account details for verification');
  }
  
  // Add recommendations based on risk factors
  riskFactors.forEach(factor => {
    if (factor.includes('Data mismatch')) {
      recommendations.push('Ensure consistent information across all documents');
    }
    
    if (factor.includes('Poor selfie quality')) {
      recommendations.push('Take a clearer selfie in good lighting conditions');
    }
    
    if (factor.includes('Headwear detected')) {
      recommendations.push('Submit a selfie without any headwear');
    }
  });
  
  return recommendations;
}

module.exports = { assessMerchantRisk };