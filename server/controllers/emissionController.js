import pool from '../config/database.js'

export const getEmissionFactors = async (req, res) => {
  try {
    const [factors] = await pool.execute(`
      SELECT * FROM emission_factor 
      ORDER BY category, activity_name
    `)
    
    res.json({ success: true, data: factors })
  } catch (error) {
    console.error('Get emission factors error:', error)
    res.status(500).json({ success: false, message: 'Error fetching emission factors' })
  }
}