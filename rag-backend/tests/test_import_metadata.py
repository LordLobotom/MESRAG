import unittest
from import_documents import extract_metadata_from_filename, infer_roles_from_department, infer_location_from_filename

class TestMetadataExtraction(unittest.TestCase):

    def test_extract_metadata_typical_filename(self):
        filename = "ISA95-Part3_2023_v2_QA_cs_SiteBrno_LineA.pdf"
        metadata = extract_metadata_from_filename(filename)
        self.assertEqual(metadata["standard"], "ISA-95")
        self.assertEqual(metadata["part"], "Part 3")
        self.assertEqual(metadata["department"], "QA")
        self.assertEqual(metadata["language"], "cs")

    def test_extract_metadata_missing_parts(self):
        filename = "SomeDoc_v1.pdf"
        metadata = extract_metadata_from_filename(filename)
        self.assertEqual(metadata["part"], "Unknown")
        self.assertEqual(metadata["department"], "Unknown")
        self.assertEqual(metadata["language"], "cs")  # default

    def test_infer_roles_known_department(self):
        roles = infer_roles_from_department("Production")
        self.assertIn("operator", roles)
        self.assertIn("engineer", roles)

    def test_infer_roles_unknown_department(self):
        roles = infer_roles_from_department("Marketing")
        self.assertEqual(roles, ["user"])

    def test_infer_location_typical_filename(self):
        filename = "ISA95-Part1_2022_v1_IT_en_SiteOstrava_LineX_Area12.docx"
        location = infer_location_from_filename(filename)
        self.assertEqual(location["hierarchy"], ["SiteOstrava", "LineX", "Area12"])
        self.assertEqual(location["custom_path"], "SiteOstrava/LineX/Area12")

    def test_infer_location_no_location(self):
        filename = "ISA95-Part1_2022_IT_en.pdf"
        location = infer_location_from_filename(filename)
        self.assertEqual(location["hierarchy"], [])
        self.assertEqual(location["custom_path"], "")

if __name__ == '__main__':
    unittest.main()
