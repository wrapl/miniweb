var ExprT = _class(null, exprInit, {
	string: exprString,
	add: exprAdd,
	sub: exprSub,
	mul: exprMul,
	div: exprDiv,
	isConst: exprIsConst,
	isZero: exprIsZero
});

var newId = (function() {
    var next = 0;
    return function() {
        return (++next).toString();
    };
})();

function exprInit(expr, value, terms) {
	expr.constant = value || 0;
	expr.terms = terms || {};
}

function exprString(expr) {
	var string = '';
	var terms = expr.terms;
	for (var id in terms) {
		var coeff = terms[id];
		if (coeff === -1) {
			string += string === '' ? '-' : ' - ';
		} else if (coeff === 1) {
			string += string === '' ? '' : ' + ';
		} else if (coeff < 0) {
			string += string === '' ? coeff : ' - ' + -coeff;
		} else {
			string += string === '' ? coeff : ' + ' + coeff;
		}
		string += id;
	}
	var value = expr.constant;
	if (value < 0) {
		string += string === '' ? value : ' - ' + -value;
	} else if (value > 0) {
		string += string === '' ? value : ' + ' + value;
	}
	return string;
}

function exprAdd(a, b) {
	if (typeof b === 'number') {
		if (b === 0) return a;
		return new ExprT(a.constant + b, a.terms);
	} else if (b instanceof ExprT) {
		var terms = {}, v;
		for (v in a.terms) terms[v] = a.terms[v];
		for (v in b.terms) {
			var coeff = (terms[v] || 0) + b.terms[v];
			if (coeff === 0) {
				delete terms[v];
			} else {
				terms[v] = coeff;
			}
		}
		return new ExprT(a.constant + b.constant, terms);
	} else {
		throw 'Invalid expression';
	}
}

function exprSub(a, b) {
	if (typeof b === 'number') {
		if (b === 0) return a;
		return new ExprT(a.constant - b, a.terms);
	} else if (b instanceof ExprT) {
		var terms = {}, v;
		for (v in a.terms) terms[v] = a.terms[v];
		for (v in b.terms) {
			var coeff = (terms[v] || 0) - b.terms[v];
			if (coeff === 0) {
				delete terms[v];
			} else {
				terms[v] = coeff;
			}
		}
		return new ExprT(a.constant - b.constant, terms);
	} else {
		throw 'Invalid expression';
	}
}

function exprMul(a, b) {
	if (typeof b === 'number') {
		if (b === 0) return new ExprT(0);
		if (b == 1) return a;
		var terms = {}, v;
		for (v in a.terms) terms[v] = a.terms[v] * b;
		return new ExprT(a.constant * b, terms);
	} else {
		throw 'Invalid expression';
	}
}

function exprDiv(a, b) {
	if (typeof b === 'number') {
		if (b === 0) return new ExprT(Infinity);
		if (b === 1) return a;
		var terms = {}, v;
		for (v in a.terms) terms[v] = a.terms[v] / b;
		return new ExprT(a.constant / b, terms);
	} else {
		throw 'Invalid expression';
	}
}

function exprIsConst(expr) {
	for (var id in expr.terms) return false;
	return true;
}

function exprIsZero(expr) {
	for (var id in expr.terms) return false;
	return expr.constant === 0;
}

var VarT = _class(ExprT, varInit);

function varInit(v, name, value) {
	exprInit(v);
	v.id = name + newId();
	v.constant = value || 0;
	v.terms[v.id] = 1;
}

export const T = _class(null, init, {
	variable: variable,
	constant: constant,
	constrain: constrain,
	unconstrain: unconstrain,
	stay: stay,
	unstay: unstay,
	unstayAll: unstayAll,
	suggest: suggest,
	resolve: resolve,
	clear: clear
});

function init(self) {
	self.variables = {};
	self.constraints = {};
	self.stays = {};
	self.varSuggestions = {};
	self.exprSuggestions = [];
	self.dummy = variable(self, 'dummy', 0);
}

function variable(self, name, value) {
	var v = new VarT(name, value);
	self.variables[v.id] = v;
	return v;
}

function constant(self, value) {
	return new ExprT(value);
}

function constrain(self, expr, equal, strength) {
	strength = strength || 0;
	var id = newId();
	if (equal) {
		if (strength) {
			self.constraints[id] = {qerror: expr, strength: strength};
		} else {
			self.constraints[id] = {equation: expr};
		}
	} else {
		if (strength) {
			var error = self.variable('error');
			self.constraints[id] = {inequality: expr.add(error), lerror: error, strength: strength};
		} else {
			self.constraints[id] = {inequality: expr};
		}
	}
	return id;
}

function unconstrain(self, id) {
	delete self.constraints[id];
}

function stay(self, v, strength) {
	self.stays[v.id] = strength || 0;
}

function unstay(self, v) {
	delete self.stays[v.id];
}

function unstayAll(self) {
	self.stays = {};
}

function suggest(self, v, value, strength) {
	if (v) {
		if (value === null) {
			self.varSuggestions[v.id] = null;
		} else {
			var suggestion = self.varSuggestions[v.id] = {expr: v.sub(value), strength: strength || 0};
		}
	} else {
		self.exprSuggestions.push({expr: value, strength: strength || 0});
	}
}

function clear(self) {
	self.varSuggestions = {};
	self.exprSuggestions = [];
}

function zeroFloatArray(n) {
	var a = new Float32Array(n);
	for (var i = 0; i < n; ++i) a[i] = 0;
	return a;
}

function resolve(self) {
	var equations = [];
	var inequalities = [];
	var lerror = [];
	var qerror = [];
	//console.debug('\n\n\n******************************* Resolving *******************************')
	//console.debug(self.constraints, self.varSuggestions, self.stays)
	for (var id in self.constraints) {
		var constraint = self.constraints[id];
		if (constraint.equation) equations.push(constraint.equation);
		if (constraint.inequality) inequalities.push(constraint.inequality);
		if (constraint.lerror) lerror.push({expr: constraint.lerror, strength: constraint.strength});
		if (constraint.qerror) qerror.push({expr: constraint.qerror, strength: constraint.strength});
	}
	//for (var i = 0; i < equations.length; ++i) console.debug(equations[i].string() + ' = 0')
	//for (var i = 0; i < inequalities.length; ++i) console.debug(inequalities[i].string() + ' ⩾ 0')
	//for (var i = 0; i < lerror.length; ++i) console.debug(lerror[i].strength + '(' + lerror[i].expr.string() + ')')
	//for (var i = 0; i < qerror.length; ++i) console.debug(qerror[i].strength + '(' + qerror[i].expr.string() + ')²')
	for (var id in self.varSuggestions) {
		var suggestion = self.varSuggestions[id];
		if (suggestion === null) continue;
		if (suggestion.strength) { qerror.push(suggestion) } else { equations.push(suggestion.expr) }
	}
	for (var i = 0; i < self.exprSuggestions.length; ++i) {
		var suggestion = self.exprSuggestions[i];
		if (suggestion.strength) { qerror.push(suggestion) } else { equations.push(suggestion.expr) }
	}
	for (var id in self.stays) if (!(id in self.varSuggestions)) {
		var v = self.variables[id];
		var expr = v.sub(v.value || 0);
		if (self.stays[id]) { qerror.push({expr: expr, strength: self.stays[id]}) } else { equations.push(expr) }
	}

	var subs = {}, equation;
	while ((equation = equations.pop())) {
		var v; for (var id in equation.terms) {v = self.variables[id]; break}
		//console.debug(equation, v)
		equation = equation.div(equation.terms[v.id]);
		for (var j = 0; j < equations.length; ++j) {
			var expr = equations[j].sub(equation.mul(equations[j].terms[v.id] || 0));
			if (expr.isConst()) { equations.splice(j--, 1) } else { equations[j] = expr }
		}
		for (var j = 0; j < inequalities.length; ++j) {
			var expr = inequalities[j].sub(equation.mul(inequalities[j].terms[v.id] || 0));
			if (expr.isConst()) { inequalities.splice(j--, 1) } else { inequalities[j] = expr }
		}
		for (var j = 0; j < lerror.length; ++j) {
			var expr = lerror[j].expr.sub(equation.mul(lerror[j].expr.terms[v.id] || 0));
			if (expr.isConst()) { lerror.splice(j--, 1) } else { lerror[j].expr = expr }
		}
		for (var j = 0; j < qerror.length; ++j) {
			var expr = qerror[j].expr.sub(equation.mul(qerror[j].expr.terms[v.id] || 0));
			if (expr.isConst()) { qerror.splice(j--, 1) } else { qerror[j].expr = expr }
		}
		for (var id in subs) if (subs[id] instanceof ExprT) subs[id] = subs[id].sub(equation.mul(subs[id].terms[v.id] || 0));
		var expr = subs[v.id] = v.sub(equation);
		if (expr instanceof ExprT) inequalities.push(expr);
	}

	//console.debug('******************************* Stage 2 *******************************')
	//for (var i = 0; i < inequalities.length; ++i) console.debug(inequalities[i].string() + ' ⩾ 0')

	inequalities = inequalities.filter(function(inequality) {
		var i = 0;
		for (var id in inequality.terms) {
			if (++i > 1) return true;
			if (inequality.terms[id] > 0) return inequality.constant != 0;
			if (inequality.terms[id] < 0) return true;
		};
		return false;
	})
	inequalities.push(self.dummy);

	//console.debug(subs, inequalities, lerror, qerror)

	//console.debug('******************************* Stage 3 *******************************')
	//for (var id in subs) console.debug(id + ' = ' + subs[id].string())
	//for (var i = 0; i < inequalities.length; ++i) console.debug(inequalities[i].string() + ' ⩾ 0')
	//for (var i = 0; i < lerror.length; ++i) console.debug(lerror[i].strength + '(' + lerror[i].expr.string() + ')')
	//for (var i = 0; i < qerror.length; ++i) console.debug(qerror[i].strength + '(' + qerror[i].expr.string() + ')²')

	var x = {}, n = 0, m = inequalities.length;
	for (var i = 0; i < m; ++i) for (var id in inequalities[i].terms) if (x[id] === undefined) x[id] = n++;
	for (var i = 0; i < lerror.length; ++i) for (var id in lerror[i].expr.terms) if (x[id] === undefined) x[id] = n++;
	for (var i = 0; i < qerror.length; ++i) for (var id in qerror[i].expr.terms) if (x[id] === undefined) x[id] = n++;

	//console.debug(x)

	var qvec = zeroFloatArray(n + m);
	var mmat = new Array(n + m);
	for (var i = 0; i < n + m; ++i) (mmat[i] = new Float32Array(n + m)).set(qvec);

	for (var i = 0; i < lerror.length; ++i) {
		var strength = lerror[i].strength;
		var terms = lerror[i].expr.terms;
		for (var id in terms) qvec[x[id]] += terms[id] * strength;
	}
	for (var i = 0; i < qerror.length; ++i) {
		var strength = qerror[i].strength;
		var terms = qerror[i].expr.terms;
		var value = qerror[i].expr.constant;
		for (var id1 in terms) {
			for (var id2 in terms) mmat[x[id1]][x[id2]] += terms[id1] * terms[id2] * strength;
			qvec[x[id1]] += terms[id1] * value * strength;
		}
	}

	for (var i = 0; i < inequalities.length; ++i) {
		var terms = inequalities[i].terms;
		for (var id in terms) {
			mmat[n + i][x[id]] = terms[id];
			mmat[x[id]][n + i] = -terms[id];
		}
		qvec[n + i] = inequalities[i].constant;
	}

	//console.debug(mmat, qvec)

	var z = lcpsolve(mmat, qvec).z;
	for (var id in x) self.variables[id].value = z[x[id]];
	for (var id in subs) {
		var sub = subs[id];
		var value = sub.constant;
		for (var id2 in sub.terms) value += sub.terms[id2] * self.variables[id2].value;
		self.variables[id].value = value;
	}

	//console.debug('******************************* Output *******************************')
	//for (var id in self.variables) console.debug(id, ' = ', self.variables[id].constant)
}

function lcpsolve(mmat, qvec, tol) {
	tol = tol || 1e-10;
	var n = qvec.length, m = 2 * n + 2;
	var allNeg = true;
	for (var i = 0; (i < n) && (allNeg = qvec[i] < 0); ++i);
	if (allNeg) return {Q: qvec, z: zeroFloatArray(n)}
	var pivot = zeroFloatArray(m);
	var tableau = new Array(n);
	for (var i = 0; i < n; ++ i) {
		var row = tableau[i] = new Float32Array(m);
		row.set(pivot);
		row[i] = 1;
		for (var j = 0; j < n; ++j) row[n + j] = -mmat[i][j];
		row[m - 2] = -1;
		row[m - 1] = qvec[i];
	}
	var basis = new Int32Array(n);
	for (var i = 0; i < n; ++i) basis[i] = i;
	var min = Infinity, locat;
	for (var i = 0; i < n; ++i) {
		var temp = tableau[i][m - 1];
		if (min > temp) {
			min = temp;
			locat = i;
		}
	}
	basis[locat] = m - 2;
	var cand = locat + n;
	var column = new Float32Array(n);
	var row = tableau[locat];
	for (var j = 0; j < m; ++j) pivot[j] = row[j] / row[m - 2];
	for (var i = 0; i < n; ++i) column[i] = tableau[i][m - 2];
	for (var i = 0; i < n; ++i) for (var j = 0; j < m; ++j) tableau[i][j] -= column[i] * pivot[j];
	for (var j = 0; j < m; ++j) row[j] = pivot[j];
	for (var max = Math.max.apply(null, basis); max == m - 2; max = Math.max.apply(null, basis)) {
		//console.debug(basis, cand)
		min = Infinity;
		for (var i = 0; i < n; ++i) if (tableau[i][cand] > 0) {
			var temp = tableau[i][m - 1] / tableau[i][cand];
			if (min > temp) {min = temp; locat = i}
		}
		if (tableau[locat, cand] <= tol) break;
		if (min == Infinity) break;
		var row = tableau[locat];
		for (var j = 0; j < m; ++j) pivot[j] = row[j] / row[cand];
		for (var i = 0; i < n; ++i) column[i] = tableau[i][cand];
		for (var i = 0; i < n; ++i) for (var j = 0; j < m; ++j) tableau[i][j] -= column[i] * pivot[j];
		for (var j = 0; j < m; ++j) row[j] = pivot[j];
		var oldVar = basis[locat];
		basis[locat] = cand;
		cand = (oldVar >= n) ? oldVar - n : oldVar + n;
	}
	//console.debug(basis, cand)
	var w = zeroFloatArray(n), z = zeroFloatArray(n);
	for (var i = 0; i < n; ++i) {
		if (basis[i] < n) {
			w[basis[i]] = tableau[i][m - 1];
		} else {
			z[basis[i] - n] = tableau[i][m - 1];
		}
	}
	return {w: w, z: z};
}

export function test() {
	s = new T();
	a = s.variable('a');
	b = s.variable('b');
	c = s.variable('c');
	w = s.variable('w');
	s.constrain(w.sub(a).sub(b).sub(c), true);
	s.stay(a, 1)
	s.stay(b, 1)
	s.stay(c, 1)
	s.suggest(w, 700);
	s.resolve();
    s.unstayAll();
}
