

def solve(N, Q, o):
  d = {}
  out = []
  for q in range(Q):
    if o[q][0] == 1:
      out.append(-1 if (not o[q][1] in d) else d[o[q][1]])
    else:
      keys = d.keys()
      if len(keys) >= N:
        del(d[min(keys)])
      d[o[q][1]] = o[q][2]

  return (out)

N = 2
Q = 5
o = [(1,2,-1), (2,1,3), (2,2,4), (2,4,5), (1,2,-1)]
print(solve(N, Q, o))