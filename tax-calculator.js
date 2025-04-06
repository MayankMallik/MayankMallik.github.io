// tax-calculator.js

// Format numbers with Indian commas
function formatIndianNumber(value) {
    value = parseFloat(value).toFixed(2);
    let parts = value.split(".");
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1] : "";
    
    // Remove any existing commas
    let numberStr = integerPart.replace(/,/g, "");
    
    // Handle numbers less than 1000
    if (numberStr.length <= 3) {
        return decimalPart ? `${numberStr}.${decimalPart}` : numberStr;
    }
    
    // Extract last 3 digits
    let lastThree = numberStr.slice(-3);
    // Get remaining digits
    let remaining = numberStr.slice(0, -3);
    
    // Insert commas every 2 digits in the remaining part
    let formattedRemaining = "";
    for (let i = remaining.length - 1; i >= 0; i -= 2) {
        if (i === 0) {
            formattedRemaining = remaining[0] + "," + formattedRemaining;
        } else {
            formattedRemaining = remaining.slice(Math.max(i-1, 0), i+1) + "," + formattedRemaining;
        }
    }
    
    // Remove trailing comma if present
    formattedRemaining = formattedRemaining.replace(/,$/, "");
    
    // Combine parts
    let result = formattedRemaining + "," + lastThree;
    return decimalPart ? `${result}.${decimalPart}` : result;
}

function computeTax(taxableIncome, threshold, slabs) {
    // If taxable income is below the minimum threshold, no tax is levied.
    if (taxableIncome < threshold) {
        return 0;
    }
    
    let tax = 0;
    let remaining = taxableIncome;
    for (let [slabAmount, rate] of slabs) {
        if (slabAmount === null) {
            // All remaining income falls into this slab.
            tax += remaining * rate;
            remaining = 0;
            break;
        } else {
            // Use the lesser of remaining income or the slab cap.
            let amountInSlab = Math.min(remaining, slabAmount);
            tax += amountInSlab * rate;
            remaining -= amountInSlab;
            if (remaining <= 0) {
                break;
            }
        }
    }
    
    // Add a 4% cess to the computed tax.
    return tax * 1.04;
}

function calculateTax(grossSalaryCalc, pensionCalc, homeloanIntCalc, sec80cCalc, npsCalc) {
    // Calculate total salary and deductions (only applicable in old regime)
    let salary = grossSalaryCalc + pensionCalc;
    let deductions = homeloanIntCalc + sec80cCalc + npsCalc;

    // ----------------- Old Regime -----------------
    // Standard deduction: 50,000 and deductions available.
    let taxableIncomeOld = Math.max(salary - deductions - 50000, 0);
    // Tax is only applied if taxable income is at least 5,00,000.
    let oldThreshold = 500001;
    let oldSlabs = [
        [250000, 0.00],   // First 2,50,000: 0%
        [250000, 0.05],   // Next 2,50,000: 5%
        [500000, 0.20],   // Next 5,00,000: 20%
        [null,   0.30]    // Remaining income: 30%
    ];
    let oldTax = computeTax(taxableIncomeOld, oldThreshold, oldSlabs);

    // ----------------- New Regime -----------------
    // Standard deduction: 75,000, no other deductions.
    let taxableIncomeNew = Math.max(salary - 75000, 0);
    // Tax is only applied if taxable income is at least 7,00,000.
    let newThreshold = 700001;
    let newSlabs = [
        [300000, 0.00],   // Up to 3,00,000: 0%
        [400000, 0.05],   // Next 4,00,000: 5%
        [300000, 0.10],   // Next 3,00,000: 10%
        [200000, 0.15],   // Next 2,00,000: 15%
        [300000, 0.20],   // Next 3,00,000: 20%
        [null,   0.30]    // Remaining income: 30%
    ];
    let newTax = computeTax(taxableIncomeNew, newThreshold, newSlabs);

    // --------------- Proposed Regime ---------------
    // Standard deduction remains 75,000.
    let taxableIncomeProposed = Math.max(salary - 75000, 0);
    // Tax is only applied if taxable income is at least 12,00,000.
    let proposedThreshold = 1200001;
    let proposedSlabs = [
        [400000, 0.00],   // Up to 4,00,000: 0%
        [400000, 0.05],   // Next 4,00,000: 5%
        [400000, 0.10],   // Next 4,00,000: 10%
        [400000, 0.15],   // Next 4,00,000: 15%
        [400000, 0.20],   // Next 4,00,000: 20%
        [400000, 0.25],   // Next 4,00,000: 25%
        [null,   0.30]    // Remaining income: 30%
    ];
    let proposedTaxNormal = computeTax(taxableIncomeProposed, proposedThreshold, proposedSlabs);
    
    // Apply marginal tax logic if salary > 12,75,000
    let marginalThreshold = 1275000;
    let proposedTax;
    if (salary > marginalThreshold) {
        let marginalTax = salary - marginalThreshold;
        proposedTax = Math.min(marginalTax, proposedTaxNormal);  // Take the lesser of marginal or normal tax
    } else {
        proposedTax = proposedTaxNormal;
    }

    return {
        oldTax: oldTax,
        newTax: newTax,
        proposedTax: proposedTax
    };
}

// Function to handle form submission
function handleSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const grossSalary = document.getElementById('gross_salary').value;
    const pension = document.getElementById('pension').value || '0';
    const homeloanInt = document.getElementById('homeloan_int').value || '0';
    const sec80c = document.getElementById('sec_80c').value || '0';
    const nps = document.getElementById('nps').value || '0';
    
    // Remove commas for calculation and convert to float
    const grossSalaryCalc = parseFloat(grossSalary.replace(/,/g, '')) || 0;
    const pensionCalc = parseFloat(pension.replace(/,/g, '')) || 0;
    const homeloanIntCalc = parseFloat(homeloanInt.replace(/,/g, '')) || 0;
    const sec80cCalc = parseFloat(sec80c.replace(/,/g, '')) || 0;
    const npsCalc = parseFloat(nps.replace(/,/g, '')) || 0;
    
    // Calculate taxes
    const { oldTax, newTax, proposedTax } = calculateTax(
        grossSalaryCalc, pensionCalc, homeloanIntCalc, sec80cCalc, npsCalc
    );
    
    // Display results
    document.getElementById('old_tax_result').textContent = formatIndianNumber(oldTax);
    document.getElementById('new_tax_result').textContent = formatIndianNumber(newTax);
    document.getElementById('proposed_tax_result').textContent = formatIndianNumber(proposedTax);
    
    // Show results section
    document.getElementById('results').style.display = 'block';
}

// Add event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('taxForm');
    form.addEventListener('submit', handleSubmit);
    
    // Optional: Add input formatting for numbers as user types
    const numberInputs = document.querySelectorAll('input[type="text"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Remove all non-digit characters
            let value = e.target.value.replace(/[^\d]/g, '');
            // Format with commas
            if (value.length > 0) {
                value = formatIndianNumber(value);
            }
            e.target.value = value;
        });
    });
});