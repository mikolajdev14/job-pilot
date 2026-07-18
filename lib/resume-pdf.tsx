import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type ResumePdfProfile = {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  currentJobTitle: string;
  yearsExperience: string;
  skills: string[];
  workExperience: Array<{
    companyName: string;
    jobTitle: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string;
  }>;
  highestDegree: string;
  fieldOfStudy: string;
  institutionName: string;
  graduationYear: string;
};

export type ResumePdfContent = {
  summary: string;
  experience: Array<{
    companyName: string;
    jobTitle: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
};

const styles = StyleSheet.create({
  page: {
    padding: 38,
    color: "#172033",
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  header: {
    borderBottom: "1pt solid #d9deea",
    paddingBottom: 12,
    marginBottom: 16,
  },
  name: {
    color: "#101828",
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  title: {
    color: "#6250d8",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 7,
  },
  contact: {
    color: "#596275",
    fontSize: 8,
  },
  section: {
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#6250d8",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  summary: {
    color: "#39445a",
    lineHeight: 1.35,
  },
  role: {
    marginBottom: 9,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
  },
  roleTitle: {
    color: "#101828",
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
  },
  dates: {
    color: "#667085",
    fontSize: 8,
  },
  company: {
    color: "#596275",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    marginBottom: 3,
  },
  bullet: {
    color: "#39445a",
    lineHeight: 1.25,
    marginBottom: 2,
    paddingLeft: 8,
  },
  skills: {
    color: "#39445a",
    lineHeight: 1.35,
  },
  education: {
    color: "#39445a",
    lineHeight: 1.35,
  },
});

function dateRange(startDate: string, endDate: string): string {
  const format = (value: string) => value ? value.replace("-", "/") : "";
  const start = format(startDate);
  const end = endDate ? format(endDate) : "Present";
  return start ? `${start} – ${end}` : end;
}

function contactLine(profile: ResumePdfProfile): string {
  return [profile.email, profile.phoneNumber, profile.location, profile.linkedinUrl, profile.portfolioUrl]
    .filter(Boolean)
    .join("  •  ");
}

export function ResumePdfDocument({ profile, content }: { profile: ResumePdfProfile; content: ResumePdfContent }) {
  const contact = contactLine(profile);
  const education = [profile.highestDegree, profile.fieldOfStudy, profile.institutionName]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document title={`${profile.fullName || "Resume"} Resume`} author="Job Pilot">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{profile.fullName || "Professional Resume"}</Text>
          {profile.currentJobTitle && <Text style={styles.title}>{profile.currentJobTitle}</Text>}
          {contact && <Text style={styles.contact}>{contact}</Text>}
        </View>

        {content.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{content.summary}</Text>
          </View>
        )}

        {content.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {content.experience.map((role, index) => (
              <View key={`${role.companyName}-${role.jobTitle}-${index}`} style={styles.role} wrap={false}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleTitle}>{role.jobTitle || "Professional Role"}</Text>
                  <Text style={styles.dates}>{dateRange(role.startDate, role.endDate)}</Text>
                </View>
                <Text style={styles.company}>{role.companyName}</Text>
                {role.bullets.map((bullet, bulletIndex) => (
                  <Text key={`${bullet}-${bulletIndex}`} style={styles.bullet}>• {bullet}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skills}>{profile.skills.join("  •  ")}</Text>
          </View>
        )}

        {education && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.education}>{education}{profile.graduationYear ? ` · ${profile.graduationYear}` : ""}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
