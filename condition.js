const condition = (num1, operator, num2) => {
  if (operator === '==') {
    return num1 === num2
  }

  if (operator === '>') {
    return num1 > num2
  }

  if (operator === '<') {
    return num1 < num2
  }

  if (operator === '>=') {
    return num1 >= num2
  }

  if (operator === '<=') {
    return num1 <= num2
  }
}

module.exports = condition
