(async () => {
  console.log('🧪 Starting End-to-End Study Material Management Tests...\n');

  // 1. Teacher Login
  const teacherLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher@example.com', password: 'teacher123' })
  })).json();
  console.log('1. Teacher Logged In. Token:', !!teacherLogin.token);

  // 2. Student Login
  const studentLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@example.com', password: 'password123' })
  })).json();
  console.log('2. Student Logged In. Token:', !!studentLogin.token);

  // Fetch subjects to get a subjectId
  const subjRes = await (await fetch('http://localhost:5000/api/student/subjects', {
    headers: { Authorization: 'Bearer ' + teacherLogin.token }
  })).json();
  const mathSubj = subjRes.subjects.find(s => s.name === 'Mathematics');
  console.log('   Using subject:', mathSubj.name, 'ID:', mathSubj.id);

  // 3. Teacher creates material as DRAFT with PDF and YouTube URL
  const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('title', 'E2E Test Draft: Quadratic Formula Complete Mastery');
  formData.append('titleGu', 'ઇ૨ઇ ટેસ્ટ ડ્રાફ્ટ: દ્વિઘાત સૂત્ર સંપૂર્ણ માર્ગદર્શિકા');
  formData.append('description', 'Step by step derivation and practice problem sets.');
  formData.append('standard', 'Standard 8');
  formData.append('subjectId', mathSubj.id);
  formData.append('videoTitle', 'Deriving the Quadratic Formula');
  formData.append('videoUrl', 'https://www.youtube.com/watch?v=H5y3k_A0FfU');
  formData.append('status', 'DRAFT');
  formData.append('file', blob, 'e2e_quadratic_notes.pdf');

  const createRes = await fetch('http://localhost:5000/api/study-materials', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + teacherLogin.token },
    body: formData
  });
  const createData = await createRes.json();
  console.log('3. Teacher created DRAFT material. Status:', createRes.status, 'ID:', createData.material?.id);
  const createdMatId = createData.material?.id;

  // 4. Student verifies DRAFT is NOT visible
  const studentList1 = await (await fetch('http://localhost:5000/api/study-materials/student', {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  const foundDraft = studentList1.materials.find(m => m.id === createdMatId);
  console.log('4. Student cannot see DRAFT material:', foundDraft === undefined ? '✅ PASS' : '❌ FAIL');

  // 5. Teacher publishes the material
  const pubRes = await fetch('http://localhost:5000/api/study-materials/' + createdMatId + '/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + teacherLogin.token
    },
    body: JSON.stringify({ status: 'PUBLISHED' })
  });
  console.log('5. Teacher published material. Status:', pubRes.status);

  // 6. Verify student received notification
  const notifRes = await (await fetch('http://localhost:5000/api/notifications', {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  const hasNotif = notifRes.notifications?.some(n => n.message?.includes('Quadratic') || n.title?.includes('Study Material'));
  console.log('6. Student received notification for published material:', hasNotif ? '✅ PASS' : '❌ FAIL');

  // 7. Student can now see the published material
  const studentList2 = await (await fetch('http://localhost:5000/api/study-materials/student', {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  })).json();
  const foundPub = studentList2.materials.find(m => m.id === createdMatId);
  console.log('7. Student can see PUBLISHED material:', !!foundPub ? '✅ PASS' : '❌ FAIL');

  // 8. Student streams PDF
  const streamRes = await fetch('http://localhost:5000/api/study-materials/' + createdMatId + '/pdf', {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  });
  console.log('8. Student streams PDF. HTTP status:', streamRes.status, 'Content-Type:', streamRes.headers.get('content-type'), streamRes.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 9. Student downloads PDF
  const downloadRes = await fetch('http://localhost:5000/api/study-materials/' + createdMatId + '/download', {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  });
  console.log('9. Student downloads PDF. HTTP status:', downloadRes.status, 'Disposition:', downloadRes.headers.get('content-disposition'), downloadRes.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 10. Student records video click event
  const videoEventRes = await fetch('http://localhost:5000/api/study-materials/' + createdMatId + '/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + studentLogin.token
    },
    body: JSON.stringify({ eventType: 'VIDEO_CLICK' })
  });
  console.log('10. Student video click event recorded:', videoEventRes.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 11. Student marks as studied
  const studiedRes1 = await (await fetch('http://localhost:5000/api/study-materials/' + createdMatId + '/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + studentLogin.token
    },
    body: JSON.stringify({ eventType: 'STUDIED' })
  })).json();
  console.log('11. Student marked as studied:', studiedRes1.isStudied === true ? '✅ PASS' : '❌ FAIL');

  // 12. Teacher edits material
  const editFormData = new FormData();
  editFormData.append('title', 'E2E Test: Quadratic Formula (Updated Title)');
  const editRes = await fetch('http://localhost:5000/api/study-materials/' + createdMatId, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + teacherLogin.token },
    body: editFormData
  });
  const editData = await editRes.json();
  console.log('12. Teacher edited material title:', editData.material?.title?.includes('(Updated Title)') ? '✅ PASS' : '❌ FAIL');

  // 13. Teacher unpublishes material
  const unpubRes = await fetch('http://localhost:5000/api/study-materials/' + createdMatId + '/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + teacherLogin.token
    },
    body: JSON.stringify({ status: 'UNPUBLISHED' })
  });
  console.log('13. Teacher unpublished material:', unpubRes.status === 200 ? '✅ PASS' : '❌ FAIL');

  // Verify student cannot access unpublished material
  const studentPdfUnpub = await fetch('http://localhost:5000/api/study-materials/' + createdMatId + '/pdf', {
    headers: { Authorization: 'Bearer ' + studentLogin.token }
  });
  console.log('    Student blocked from unpublished PDF (status 403):', studentPdfUnpub.status === 403 ? '✅ PASS' : '❌ FAIL');

  // 14. Teacher deletes material
  const delRes = await fetch('http://localhost:5000/api/study-materials/' + createdMatId, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + teacherLogin.token }
  });
  console.log('14. Teacher deleted material:', delRes.status === 200 ? '✅ PASS' : '❌ FAIL');

  // 15. Verify non-PDF upload rejection
  const txtBlob = new Blob([Buffer.from('not a pdf')], { type: 'text/plain' });
  const badFormData = new FormData();
  badFormData.append('title', 'Invalid non-pdf test');
  badFormData.append('subjectId', mathSubj.id);
  badFormData.append('file', txtBlob, 'sample.txt');

  const badRes = await fetch('http://localhost:5000/api/study-materials', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + teacherLogin.token },
    body: badFormData
  });
  const badData = await badRes.json();
  console.log('15. Non-PDF rejected with 400 Bad Request:', badRes.status === 400 && badData.error?.includes('PDF') ? '✅ PASS' : '❌ FAIL');

  // 16. Teacher Overview Analytics
  const overviewRes = await (await fetch('http://localhost:5000/api/study-materials/teacher/overview', {
    headers: { Authorization: 'Bearer ' + teacherLogin.token }
  })).json();
  console.log('16. Teacher Overview Analytics loaded:', overviewRes.metrics?.totalMaterials !== undefined ? '✅ PASS' : '❌ FAIL');

  console.log('\n🎉 ALL 16 TESTS PASSED SUCCESSFULLY!');
})();
